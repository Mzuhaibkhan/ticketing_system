from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.agent import Agent
from app.schemas.message import MessageCreate, MessageOut
from app.services import message_service
from app.core.auth import get_current_agent

router = APIRouter(prefix="/api/tickets/{id}/messages", tags=["Messages"])


@router.get("", response_model=List[MessageOut])
def list_messages(
    id: int,
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    """Retrieve all messages (replies and notes) for a ticket, oldest first."""
    return message_service.list_messages(db, id)


@router.post("", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
def add_message(
    id: int,
    data: MessageCreate,
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    """Add a public reply or internal note to a ticket, bumping ticket activity."""
    if data.author_id is None:
        data.author_id = current_agent.id
    return message_service.add_message(db, id, data)
