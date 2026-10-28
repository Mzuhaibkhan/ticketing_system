from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    Index,
    JSON,
    Enum as SAEnum,
    func
)
from sqlalchemy.orm import relationship
from app.db import Base
from app.models.enums import EventType


class TicketEvent(Base):
    __tablename__ = "ticket_events"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    ticket_id = Column(
        Integer,
        ForeignKey("tickets.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    event_type = Column(
        SAEnum(EventType, values_callable=lambda x: [e.value for e in x]),
        nullable=False
    )
    actor_id = Column(
        Integer,
        ForeignKey("agents.id", ondelete="SET NULL"),
        nullable=True
    )
    actor_name = Column(String(100), nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True
    )

    __table_args__ = (
        Index("ix_ticket_events_ticket_created", ticket_id, created_at),
    )

    ticket = relationship("Ticket", back_populates="events")
    actor = relationship("Agent", back_populates="events", foreign_keys=[actor_id])

