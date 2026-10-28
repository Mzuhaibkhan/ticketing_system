from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.models.enums import MessageKind


class MessageCreate(BaseModel):
    kind: MessageKind
    body: str = Field(..., max_length=10000)
    author_id: Optional[int] = None

    @field_validator("body")
    @classmethod
    def validate_body(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Message body cannot be empty")
        if len(trimmed) > 10000:
            raise ValueError("Message body must not exceed 10000 characters")
        return trimmed


class MessageOut(BaseModel):
    id: int
    ticket_id: int
    kind: MessageKind
    body: str
    author_id: Optional[int] = None
    author_name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

