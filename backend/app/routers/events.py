from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.agent import Agent
from app.schemas.event import EventOut
from app.services import event_service
from app.core.auth import get_current_agent

router = APIRouter(prefix="/api/tickets/{id}/events", tags=["Events"])


@router.get("", response_model=List[EventOut])
def list_events(
    id: int,
    db: Session = Depends(get_db),
    current_agent: Agent = Depends(get_current_agent),
):
    """Retrieve full audit history for a ticket, oldest first."""
    return event_service.list_events(db, id)
