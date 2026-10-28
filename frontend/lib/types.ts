export type TicketStatus = "open" | "in_progress" | "waiting_on_customer" | "resolved";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export type MessageKind = "public_reply" | "internal_note";

export type EventType =
  | "created"
  | "status_changed"
  | "priority_changed"
  | "assignee_changed"
  | "reply_added"
  | "note_added"
  | "fields_updated";

export type AgentRole = "admin" | "agent";

export interface Agent {
  id: number;
  name: string;
  email: string;
  role: AgentRole;
}

export interface AgentBrief {
  id: number;
  name: string;
}

export interface Ticket {
  id: number;
  subject: string;
  customer_name: string | null;
  customer_email: string | null;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignee_id: number | null;
  assignee: AgentBrief | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  is_overdue: boolean;
  age_hours: number;
}

export interface TicketMessage {
  id: number;
  ticket_id: number;
  kind: MessageKind;
  body: string;
  author_id: number | null;
  author_name: string;
  created_at: string;
}

export interface TicketEvent {
  id: number;
  ticket_id: number;
  event_type: EventType;
  actor_id: number | null;
  actor_name: string | null;
  old_value: string | null;
  new_value: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface DashboardStats {
  total: number;
  open: number;
  in_progress: number;
  waiting_on_customer: number;
  resolved: number;
  urgent: number;
  overdue: number;
  unresolved: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface TicketFilters {
  q?: string;
  status?: TicketStatus[];
  priority?: TicketPriority[];
  assignee_id?: string;
  overdue?: boolean;
  sort?: "updated" | "priority";
  page?: number;
  page_size?: number;
}

export interface TicketCreatePayload {
  subject: string;
  customer_name?: string | null;
  customer_email?: string | null;
  description: string;
  priority?: TicketPriority;
  status?: TicketStatus;
  assignee_id?: number | null;
  actor_id?: number | null;
}

export interface TicketUpdatePayload {
  subject?: string;
  customer_name?: string | null;
  customer_email?: string | null;
  description?: string;
  priority?: TicketPriority;
  status?: TicketStatus;
  assignee_id?: number | null;
  actor_id?: number | null;
}

export interface MessageCreatePayload {
  kind: MessageKind;
  body: string;
  author_id?: number | null;
}

