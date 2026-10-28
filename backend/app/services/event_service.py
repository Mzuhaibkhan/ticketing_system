from typing import List
from sqlalchemy.orm import Session
from app.models import Ticket, TicketEvent
from app.core.errors import NotFoundError


def list_events(db: Session, ticket_id: int) -> List[TicketEvent]:
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise NotFoundError(
            code="ticket_not_found",
            message=f"Ticket #{ticket_id} not found"
        )

    return (
        db.query(TicketEvent)
        .filter(TicketEvent.ticket_id == ticket_id)
        .order_by(TicketEvent.created_at.asc())
        .all()
    )

