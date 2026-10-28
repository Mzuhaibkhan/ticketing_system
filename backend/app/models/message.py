from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    Index,
    Enum as SAEnum,
    func
)
from sqlalchemy.orm import relationship
from app.db import Base
from app.models.enums import MessageKind


class TicketMessage(Base):
    __tablename__ = "ticket_messages"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    ticket_id = Column(
        Integer,
        ForeignKey("tickets.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    kind = Column(
        SAEnum(MessageKind, values_callable=lambda x: [e.value for e in x]),
        nullable=False
    )
    body = Column(Text, nullable=False)
    author_id = Column(
        Integer,
        ForeignKey("agents.id", ondelete="SET NULL"),
        nullable=True
    )
    author_name = Column(String(100), nullable=False)
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True
    )

    __table_args__ = (
        Index("ix_ticket_messages_ticket_created", ticket_id, created_at),
    )

    ticket = relationship("Ticket", back_populates="messages")
    author = relationship("Agent", back_populates="messages", foreign_keys=[author_id])

