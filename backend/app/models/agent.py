from sqlalchemy import Column, Integer, String, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.db import Base
from app.models.enums import AgentRole


class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    role = Column(
        SAEnum(AgentRole, values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=AgentRole.AGENT,
        server_default="agent"
    )

    tickets = relationship("Ticket", back_populates="assignee", foreign_keys="Ticket.assignee_id")
    messages = relationship("TicketMessage", back_populates="author", foreign_keys="TicketMessage.author_id")
    events = relationship("TicketEvent", back_populates="actor", foreign_keys="TicketEvent.actor_id")

