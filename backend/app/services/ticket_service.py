from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple, Union
from sqlalchemy import and_, or_, case, func, select
from sqlalchemy.orm import Session, joinedload

from app.config import settings
from app.models import (
    Agent,
    Ticket,
    TicketStatus,
    TicketPriority,
    TicketEvent,
    EventType,
)
from app.schemas.ticket import TicketCreate, TicketUpdate, TicketOut
from app.core.errors import AppError, NotFoundError


def overdue_clause(now: Optional[datetime] = None):
    """Shared overdue filter expression. Strictly created_at < now - OVERDUE_HOURS."""
    if now is None:
        now = datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=settings.OVERDUE_HOURS)
    return and_(
        Ticket.status != TicketStatus.RESOLVED,
        Ticket.created_at < cutoff
    )


def get_actor_name(db: Session, actor_id: Optional[int]) -> Optional[str]:
    if actor_id is None:
        return "System"
    agent = db.query(Agent).filter(Agent.id == actor_id).first()
    return agent.name if agent else "Unknown Agent"


def create_ticket(db: Session, data: TicketCreate) -> Ticket:
    now = datetime.now(timezone.utc)

    # Validate assignee if provided
    if data.assignee_id is not None:
        assignee = db.query(Agent).filter(Agent.id == data.assignee_id).first()
        if not assignee:
            raise AppError(
                code="validation_error",
                message="Assignee not found",
                status_code=422,
                details=[{"field": "assignee_id", "message": f"Agent with id {data.assignee_id} does not exist"}]
            )

    actor_name = get_actor_name(db, data.actor_id)

    # Handle initial resolved_at if created as resolved
    resolved_at = now if data.status == TicketStatus.RESOLVED else None

    ticket = Ticket(
        subject=data.subject,
        customer_name=data.customer_name,
        customer_email=str(data.customer_email) if data.customer_email else None,
        description=data.description,
        status=data.status,
        priority=data.priority,
        assignee_id=data.assignee_id,
        created_at=now,
        updated_at=now,
        resolved_at=resolved_at,
    )
    db.add(ticket)
    db.flush()

    # Append creation event
    create_event = TicketEvent(
        ticket_id=ticket.id,
        event_type=EventType.CREATED,
        actor_id=data.actor_id,
        actor_name=actor_name,
        new_value=f"Ticket created ({data.status.value}, {data.priority.value})",
        created_at=now
    )
    db.add(create_event)

    db.commit()
    db.refresh(ticket)
    return ticket


def get_ticket(db: Session, ticket_id: int) -> Ticket:
    ticket = db.query(Ticket).options(joinedload(Ticket.assignee)).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise NotFoundError(
            code="ticket_not_found",
            message=f"Ticket #{ticket_id} not found"
        )
    return ticket


def list_tickets(
    db: Session,
    q: Optional[str] = None,
    statuses: Optional[List[TicketStatus]] = None,
    priorities: Optional[List[TicketPriority]] = None,
    assignee_id: Optional[Union[int, str]] = None,
    overdue: Optional[bool] = None,
    sort: str = "updated",
    page: int = 1,
    page_size: int = 20,
    now: Optional[datetime] = None
) -> Tuple[List[Ticket], int]:
    if now is None:
        now = datetime.now(timezone.utc)

    query = db.query(Ticket).options(joinedload(Ticket.assignee))

    # Text search
    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                Ticket.subject.ilike(term),
                Ticket.customer_name.ilike(term),
                Ticket.customer_email.ilike(term)
            )
        )

    # Status filter
    if statuses:
        query = query.filter(Ticket.status.in_(statuses))

    # Priority filter
    if priorities:
        query = query.filter(Ticket.priority.in_(priorities))

    # Assignee filter
    if assignee_id is not None:
        if str(assignee_id).lower() == "unassigned":
            query = query.filter(Ticket.assignee_id.is_(None))
        else:
            try:
                aid = int(assignee_id)
                query = query.filter(Ticket.assignee_id == aid)
            except ValueError:
                pass

    # Overdue filter
    if overdue is True:
        query = query.filter(overdue_clause(now))

    # Total count before pagination
    total = query.count()

    # Sorting
    if sort == "priority":
        # Urgent -> High -> Medium -> Low, ties broken by updated_at DESC
        priority_rank = case(
            (Ticket.priority == TicketPriority.URGENT, 1),
            (Ticket.priority == TicketPriority.HIGH, 2),
            (Ticket.priority == TicketPriority.MEDIUM, 3),
            (Ticket.priority == TicketPriority.LOW, 4),
            else_=5
        )
        query = query.order_by(priority_rank.asc(), Ticket.updated_at.desc())
    else:
        # Default: updated_at DESC
        query = query.order_by(Ticket.updated_at.desc())

    # Pagination
    offset = (max(1, page) - 1) * page_size
    items = query.offset(offset).limit(page_size).all()

    return items, total


def update_ticket(
    db: Session,
    ticket_id: int,
    data: TicketUpdate,
    now: Optional[datetime] = None
) -> Ticket:
    if now is None:
        now = datetime.now(timezone.utc)

    # Load ticket
    query = db.query(Ticket)
    if not settings.DATABASE_URL.startswith("sqlite"):
        query = query.with_for_update()

    ticket = query.filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise NotFoundError(
            code="ticket_not_found",
            message=f"Ticket #{ticket_id} not found"
        )

    update_dict = data.model_dump(exclude_unset=True)
    actor_id = update_dict.pop("actor_id", None)
    actor_name = get_actor_name(db, actor_id)

    events_to_add: List[TicketEvent] = []
    has_changes = False

    # 1. Tracked field: status
    if "status" in update_dict and update_dict["status"] is not None:
        new_status = update_dict["status"]
        if new_status != ticket.status:
            old_status_val = ticket.status.value
            new_status_val = new_status.value
            ticket.status = new_status
            has_changes = True

            # Resolution handling
            if new_status == TicketStatus.RESOLVED:
                ticket.resolved_at = now
            elif old_status_val == TicketStatus.RESOLVED.value:
                # Reopening ticket clears resolved_at
                ticket.resolved_at = None

            events_to_add.append(
                TicketEvent(
                    ticket_id=ticket.id,
                    event_type=EventType.STATUS_CHANGED,
                    actor_id=actor_id,
                    actor_name=actor_name,
                    old_value=old_status_val,
                    new_value=new_status_val,
                    created_at=now
                )
            )

    # 2. Tracked field: priority
    if "priority" in update_dict and update_dict["priority"] is not None:
        new_priority = update_dict["priority"]
        if new_priority != ticket.priority:
            old_priority_val = ticket.priority.value
            new_priority_val = new_priority.value
            ticket.priority = new_priority
            has_changes = True

            events_to_add.append(
                TicketEvent(
                    ticket_id=ticket.id,
                    event_type=EventType.PRIORITY_CHANGED,
                    actor_id=actor_id,
                    actor_name=actor_name,
                    old_value=old_priority_val,
                    new_value=new_priority_val,
                    created_at=now
                )
            )

    # 3. Tracked field: assignee_id
    if "assignee_id" in update_dict:
        new_assignee_id = update_dict["assignee_id"]
        if new_assignee_id != ticket.assignee_id:
            old_agent = db.query(Agent).filter(Agent.id == ticket.assignee_id).first() if ticket.assignee_id else None
            old_name = old_agent.name if old_agent else "Unassigned"

            new_name = "Unassigned"
            if new_assignee_id is not None:
                new_agent = db.query(Agent).filter(Agent.id == new_assignee_id).first()
                if not new_agent:
                    raise AppError(
                        code="validation_error",
                        message="Assignee not found",
                        status_code=422,
                        details=[{"field": "assignee_id", "message": f"Agent with id {new_assignee_id} does not exist"}]
                    )
                new_name = new_agent.name

            ticket.assignee_id = new_assignee_id
            has_changes = True

            events_to_add.append(
                TicketEvent(
                    ticket_id=ticket.id,
                    event_type=EventType.ASSIGNEE_CHANGED,
                    actor_id=actor_id,
                    actor_name=actor_name,
                    old_value=old_name,
                    new_value=new_name,
                    details={
                        "old_assignee_id": old_agent.id if old_agent else None,
                        "new_assignee_id": new_assignee_id
                    },
                    created_at=now
                )
            )

    # 4. Other edited fields (subject, description, customer_name, customer_email)
    other_changed_fields = []
    for field in ["subject", "description", "customer_name", "customer_email"]:
        if field in update_dict:
            new_val = update_dict[field]
            old_val = getattr(ticket, field)
            if new_val != old_val:
                setattr(ticket, field, new_val)
                other_changed_fields.append(field)
                has_changes = True

    if other_changed_fields:
        events_to_add.append(
            TicketEvent(
                ticket_id=ticket.id,
                event_type=EventType.FIELDS_UPDATED,
                actor_id=actor_id,
                actor_name=actor_name,
                new_value=f"Updated: {', '.join(other_changed_fields)}",
                details={"fields": other_changed_fields},
                created_at=now
            )
        )

    # If changes made, update updated_at and commit once
    if has_changes:
        ticket.updated_at = now
        for ev in events_to_add:
            db.add(ev)
        db.commit()
        db.refresh(ticket)

    return ticket

