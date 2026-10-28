import enum


class AgentRole(str, enum.Enum):
    ADMIN = "admin"
    AGENT = "agent"


class TicketStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    WAITING_ON_CUSTOMER = "waiting_on_customer"
    RESOLVED = "resolved"


class TicketPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class MessageKind(str, enum.Enum):
    PUBLIC_REPLY = "public_reply"
    INTERNAL_NOTE = "internal_note"


class EventType(str, enum.Enum):
    CREATED = "created"
    STATUS_CHANGED = "status_changed"
    PRIORITY_CHANGED = "priority_changed"
    ASSIGNEE_CHANGED = "assignee_changed"
    REPLY_ADDED = "reply_added"
    NOTE_ADDED = "note_added"
    FIELDS_UPDATED = "fields_updated"

