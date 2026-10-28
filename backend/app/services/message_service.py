from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session

from app.models import (
    Agent,
    Ticket,
    TicketMessage,
    MessageKind,
    TicketEvent,
    EventType,
)
from app.schemas.message import MessageCreate
from app.core.errors import AppError, NotFoundError


def add_message(
    db: Session,
    ticket_id: int,
    data: MessageCreate,
    now: Optional[datetime] = None
) -> TicketMessage:
    if now is None:
        now = datetime.now(timezone.utc)

    # 1. Verify ticket exists
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise NotFoundError(
            code="ticket_not_found",
            message=f"Ticket #{ticket_id} not found"
        )

    # 2. Resolve author name snapshot
    author_name = "Agent"
    if data.author_id is not None:
        agent = db.query(Agent).filter(Agent.id == data.author_id).first()
        if not agent:
            raise AppError(
                code="validation_error",
                message="Author not found",
                status_code=422,
                details=[{"field": "author_id", "message": f"Agent with id {data.author_id} does not exist"}]
            )
        author_name = agent.name

    # 3. Insert message
    message = TicketMessage(
        ticket_id=ticket.id,
        kind=data.kind,
        body=data.body,
        author_id=data.author_id,
        author_name=author_name,
        created_at=now
    )
    db.add(message)
    db.flush()

    # 4. Insert corresponding event
    event_type = EventType.REPLY_ADDED if data.kind == MessageKind.PUBLIC_REPLY else EventType.NOTE_ADDED
    event = TicketEvent(
        ticket_id=ticket.id,
        event_type=event_type,
        actor_id=data.author_id,
        actor_name=author_name,
        new_value=data.body[:100] + ("..." if len(data.body) > 100 else ""),
        created_at=now
    )
    db.add(event)

    # 5. Bump ticket's updated_at and record first public reply for SLA
    ticket.updated_at = now
    if data.kind == MessageKind.PUBLIC_REPLY and getattr(ticket, "first_responded_at", None) is None:
        ticket.first_responded_at = now

    # 6. Single transaction commit
    db.commit()
    db.refresh(message)
    return message


def list_messages(db: Session, ticket_id: int) -> List[TicketMessage]:
    # Verify ticket exists
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise NotFoundError(
            code="ticket_not_found",
            message=f"Ticket #{ticket_id} not found"
        )

    return (
        db.query(TicketMessage)
        .filter(TicketMessage.ticket_id == ticket_id)
        .order_by(TicketMessage.created_at.asc())
        .all()
    )
