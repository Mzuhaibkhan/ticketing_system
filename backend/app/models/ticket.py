from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    CheckConstraint,
    Index,
    Enum as SAEnum,
    func
)
from sqlalchemy.orm import relationship
from app.db import Base
from app.models.enums import TicketStatus, TicketPriority


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    subject = Column(String(200), nullable=False)
    customer_name = Column(String(120), nullable=True)
    customer_email = Column(String(255), nullable=True)
    description = Column(Text, nullable=False)
    status = Column(
        SAEnum(TicketStatus, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=TicketStatus.OPEN,
        index=True
    )
    priority = Column(
        SAEnum(TicketPriority, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=TicketPriority.MEDIUM,
        index=True
    )
    assignee_id = Column(
        Integer,
        ForeignKey("agents.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        CheckConstraint(
            "(customer_name IS NOT NULL AND length(trim(customer_name)) > 0) OR "
            "(customer_email IS NOT NULL AND length(trim(customer_email)) > 0)",
            name="check_customer_present"
        ),
        CheckConstraint(
            "length(trim(subject)) > 0",
            name="check_subject_not_empty"
        ),
        Index("ix_tickets_updated_at_desc", updated_at.desc()),
    )

    assignee = relationship("Agent", back_populates="tickets", foreign_keys=[assignee_id])
    messages = relationship(
        "TicketMessage",
        back_populates="ticket",
        cascade="all, delete-orphan",
        order_by="TicketMessage.created_at.asc()"
    )
    events = relationship(
        "TicketEvent",
        back_populates="ticket",
        cascade="all, delete-orphan",
        order_by="TicketEvent.created_at.asc()"
    )

