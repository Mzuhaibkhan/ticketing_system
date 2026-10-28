from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict
from app.models.enums import EventType


class EventOut(BaseModel):
    id: int
    ticket_id: int
    event_type: EventType
    actor_id: Optional[int] = None
    actor_name: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    details: Optional[Any] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

