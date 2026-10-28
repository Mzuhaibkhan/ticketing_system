from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.event import EventOut
from app.services import event_service

router = APIRouter(prefix="/api/tickets/{id}/events", tags=["Events"])


@router.get("", response_model=List[EventOut])
def list_events(
    id: int,
    db: Session = Depends(get_db)
):
    """Retrieve full audit history for a ticket, oldest first."""
    return event_service.list_events(db, id)

