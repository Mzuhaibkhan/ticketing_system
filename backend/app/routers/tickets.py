from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.enums import TicketStatus, TicketPriority
from app.schemas.ticket import TicketCreate, TicketUpdate, TicketOut
from app.schemas.common import PaginatedResponse
from app.services import ticket_service

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])


@router.get("", response_model=PaginatedResponse[TicketOut])
def list_tickets(
    q: Optional[str] = Query(None, description="Search subject or customer name/email"),
    status: Optional[List[TicketStatus]] = Query(None, description="Filter by status (repeatable)"),
    priority: Optional[List[TicketPriority]] = Query(None, description="Filter by priority (repeatable)"),
    assignee_id: Optional[str] = Query(None, description="Filter by agent id or 'unassigned'"),
    overdue: Optional[bool] = Query(None, description="Filter by overdue (>24h and unresolved)"),
    sort: str = Query("updated", pattern="^(updated|priority)$", description="Sort order: updated or priority"),
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
):
    """List tickets with search, multi-select filters, sorting, and pagination."""
    items, total = ticket_service.list_tickets(
        db=db,
        q=q,
        statuses=status,
        priorities=priority,
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
    db: Session = Depends(get_db)
):
    """Create a new ticket and record the creation audit event."""
    ticket = ticket_service.create_ticket(db, data)
    response.headers["Location"] = f"/api/tickets/{ticket.id}"
    return TicketOut.from_orm_with_computed(ticket)


@router.get("/{id}", response_model=TicketOut)
def get_ticket(
    id: int,
    db: Session = Depends(get_db)
):
    """Retrieve full ticket details including computed age, overdue flag, and assignee."""
    ticket = ticket_service.get_ticket(db, id)
    return TicketOut.from_orm_with_computed(ticket)


@router.patch("/{id}", response_model=TicketOut)
def update_ticket(
    id: int,
    data: TicketUpdate,
    db: Session = Depends(get_db)
):
    """Partially update a ticket. Automatically writes audit events for changed fields."""
    ticket = ticket_service.update_ticket(db, id, data)
    return TicketOut.from_orm_with_computed(ticket)

