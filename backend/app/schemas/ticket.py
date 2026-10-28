from datetime import datetime, timedelta, timezone
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator
from app.models.enums import TicketStatus, TicketPriority
from app.schemas.agent import AgentBrief
from app.config import settings


class TicketBase(BaseModel):
    subject: str = Field(..., max_length=200)
    customer_name: Optional[str] = Field(None, max_length=120)
    customer_email: Optional[EmailStr] = None
    description: str = Field(..., max_length=5000)
    priority: TicketPriority = TicketPriority.MEDIUM
    status: TicketStatus = TicketStatus.OPEN
    assignee_id: Optional[int] = None


class TicketCreate(BaseModel):
    subject: str = Field(..., max_length=200)
    customer_name: Optional[str] = Field(None, max_length=120)
    customer_email: Optional[EmailStr] = None
    description: str = Field(..., max_length=5000)
    priority: TicketPriority = TicketPriority.MEDIUM
    status: TicketStatus = TicketStatus.OPEN
    assignee_id: Optional[int] = None
    actor_id: Optional[int] = None

    @field_validator("subject")
    @classmethod
    def validate_subject(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Subject cannot be blank or empty")
        if len(trimmed) > 200:
            raise ValueError("Subject must not exceed 200 characters")
        return trimmed

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Description cannot be blank or empty")
        if len(trimmed) > 5000:
            raise ValueError("Description must not exceed 5000 characters")
        return trimmed

    @field_validator("customer_name")
    @classmethod
    def validate_customer_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            trimmed = v.strip()
            if not trimmed:
                return None
            if len(trimmed) > 120:
                raise ValueError("Customer name must not exceed 120 characters")
            return trimmed
        return None

    @model_validator(mode="after")
    def validate_customer_present(self) -> "TicketCreate":
        if not self.customer_name and not self.customer_email:
            raise ValueError("At least one customer identifier (name or email) is required")
        return self


class TicketUpdate(BaseModel):
    subject: Optional[str] = Field(None, max_length=200)
    customer_name: Optional[str] = Field(None, max_length=120)
    customer_email: Optional[EmailStr] = None
    description: Optional[str] = Field(None, max_length=5000)
    priority: Optional[TicketPriority] = None
    status: Optional[TicketStatus] = None
    assignee_id: Optional[int] = None
    actor_id: Optional[int] = None
    expected_version: Optional[int] = None

    @field_validator("subject")
    @classmethod
    def validate_subject(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            trimmed = v.strip()
            if not trimmed:
                raise ValueError("Subject cannot be blank or empty")
            if len(trimmed) > 200:
                raise ValueError("Subject must not exceed 200 characters")
            return trimmed
        return None

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            trimmed = v.strip()
            if not trimmed:
                raise ValueError("Description cannot be blank or empty")
            if len(trimmed) > 5000:
                raise ValueError("Description must not exceed 5000 characters")
            return trimmed
        return None

    @field_validator("customer_name")
    @classmethod
    def validate_customer_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            trimmed = v.strip()
            if not trimmed:
                return None
            if len(trimmed) > 120:
                raise ValueError("Customer name must not exceed 120 characters")
            return trimmed
        return None


class TicketOut(BaseModel):
    id: int
    subject: str
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    description: str
    status: TicketStatus
    priority: TicketPriority
    assignee_id: Optional[int] = None
    assignee: Optional[AgentBrief] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    first_responded_at: Optional[datetime] = None
    version: int = 1
    is_overdue: bool
    age_hours: float
    sla_target_hours: int = 24
    sla_due_at: Optional[datetime] = None
    sla_breached: bool = False

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def from_orm_with_computed(
        cls,
        ticket,
        now: Optional[datetime] = None,
        is_overdue_val: Optional[bool] = None
    ) -> "TicketOut":
        if now is None:
            now = datetime.now(timezone.utc)

        # Ensure ticket.created_at is timezone-aware
        created_at = ticket.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)

        age_seconds = (now - created_at).total_seconds()
        age_hours = round(max(0.0, age_seconds / 3600.0), 1)

        if is_overdue_val is not None:
            overdue = is_overdue_val
        else:
            overdue = (
                ticket.status != TicketStatus.RESOLVED and
                (now - created_at).total_seconds() > settings.OVERDUE_HOURS * 3600
            )

        # Compute SLA target & breach
        sla_hours_dict = settings.SLA_HOURS if isinstance(settings.SLA_HOURS, dict) else {"urgent": 4, "high": 8, "medium": 24, "low": 48}
        target_hours = sla_hours_dict.get(ticket.priority.value, 24)
        due_at = created_at + timedelta(hours=target_hours)

        if ticket.first_responded_at is not None:
            first_resp = ticket.first_responded_at
            if first_resp.tzinfo is None:
                first_resp = first_resp.replace(tzinfo=timezone.utc)
            sla_breached = first_resp > due_at
        else:
            sla_breached = ticket.status != TicketStatus.RESOLVED and now > due_at

        assignee_brief = None
        if ticket.assignee:
            assignee_brief = AgentBrief(id=ticket.assignee.id, name=ticket.assignee.name)

        return cls(
            id=ticket.id,
            subject=ticket.subject,
            customer_name=ticket.customer_name,
            customer_email=ticket.customer_email,
            description=ticket.description,
            status=ticket.status,
            priority=ticket.priority,
            assignee_id=ticket.assignee_id,
            assignee=assignee_brief,
            created_at=ticket.created_at,
            updated_at=ticket.updated_at,
            resolved_at=ticket.resolved_at,
            first_responded_at=getattr(ticket, "first_responded_at", None),
            version=getattr(ticket, "version", 1) or 1,
            is_overdue=overdue,
            age_hours=age_hours,
            sla_target_hours=target_hours,
            sla_due_at=due_at,
            sla_breached=sla_breached,
        )
