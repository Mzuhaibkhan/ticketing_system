from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.agent import Agent
from app.models.enums import TicketStatus, TicketPriority
from app.schemas.ticket import TicketCreate, TicketUpdate, TicketOut
from app.schemas.common import PaginatedResponse
from app.services import ticket_service
from app.core.errors import AppError
from app.core.auth import get_current_agent

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])


def parse_enums(values: Optional[List[str]], enum_cls, field_name: str):
    if not values:
        return None
    parsed = []
    for item in values:
        for part in item.split(","):
            part = part.strip()
            if not part:
                continue
            try:
                parsed.append(enum_cls(part))
            except ValueError:
                raise AppError(
                    code="validation_error",
                    message=f"Invalid {field_name} value: '{part}'",
                    status_code=422,
                    details=[{"field": field_name, "message": f"'{part}' is not a valid {field_name}"}]
                )
    return parsed if parsed else None


@router.get("", response_model=PaginatedResponse[TicketOut])
def list_tickets(
    q: Optional[str] = Query(None, description="Search subject or customer name/email"),
    status: Optional[List[str]] = Query(None, description="Filter by status (repeatable or comma-separated)"),
    priority: Optional[List[str]] = Query(None, description="Filter by priority (repeatable or comma-separated)"),
    assignee_id: Optional[str] = Query(None, description="Filter by agent id or 'unassigned'"),
    overdue: Optional[bool] = Query(None, description="Filter by overdue (>24h and unresolved)"),
    sort: str = Query("updated", pattern="^(updated|priority|created)$", description="Sort order: updated, priority, or created"),
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    """List tickets with search, multi-select filters, sorting, and pagination."""
    parsed_statuses = parse_enums(status, TicketStatus, "status")
    parsed_priorities = parse_enums(priority, TicketPriority, "priority")

    items, total = ticket_service.list_tickets(
        db=db,
        q=q,
        statuses=parsed_statuses,
        priorities=parsed_priorities,
        assignee_id=assignee_id,
        overdue=overdue,
        sort=sort,
        page=page,
        page_size=page_size
    )

    ticket_outs = [TicketOut.from_orm_with_computed(t) for t in items]

    return PaginatedResponse(
        items=ticket_outs,
        total=total,
        page=page,
        page_size=page_size
    )


@router.post("", response_model=TicketOut, status_code=status.HTTP_201_CREATED)
def create_ticket(
    data: TicketCreate,
    response: Response,
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    """Create a new ticket and record the creation audit event."""
    if data.actor_id is None:
        data.actor_id = current_agent.id
    ticket = ticket_service.create_ticket(db, data)
    response.headers["Location"] = f"/api/tickets/{ticket.id}"
    return TicketOut.from_orm_with_computed(ticket)


@router.get("/{id}", response_model=TicketOut)
def get_ticket(
    id: int,
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    """Retrieve full ticket details including computed age, overdue flag, version, and SLA."""
    ticket = ticket_service.get_ticket(db, id)
    return TicketOut.from_orm_with_computed(ticket)


@router.patch("/{id}", response_model=TicketOut)
def update_ticket(
    id: int,
    data: TicketUpdate,
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    """Partially update a ticket with optimistic locking and role enforcement."""
    if data.actor_id is None:
        data.actor_id = current_agent.id
    ticket = ticket_service.update_ticket(db, id, data)
    return TicketOut.from_orm_with_computed(ticket)
