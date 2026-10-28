import {
  Agent,
  DashboardStats,
  MessageCreatePayload,
  PaginatedResponse,
  Ticket,
  TicketCreatePayload,
  TicketEvent,
  TicketFilters,
  TicketMessage,
  TicketUpdatePayload,
} from "./types";

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export class ApiError extends Error {
  status: number;
  code: string;
  details: ApiErrorDetail[];

  constructor(status: number, code: string, message: string, details: ApiErrorDetail[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const API_BASE_URL =
  (() => {
    let raw = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");
    if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
      raw = `https://${raw}`;
    }
    return raw.endsWith("/api") ? raw : `${raw}/api`;
  })();

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorCode = "unknown_error";
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorDetails: ApiErrorDetail[] = [];

    try {
      const data = await response.json();
      if (data?.error) {
        errorCode = data.error.code || errorCode;
        errorMessage = data.error.message || errorMessage;
        errorDetails = Array.isArray(data.error.details) ? data.error.details : [];
      } else if (data?.message) {
        errorMessage = data.message;
      }
    } catch {
      // Body wasn't JSON
    }

    throw new ApiError(response.status, errorCode, errorMessage, errorDetails);
  }

  // 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Health
  getHealth: () => request<{ status: string; database: string; version: string }>("/health"),

  // Agents
  getAgents: () => request<Agent[]>("/agents"),

  // Dashboard
  getDashboardStats: () => request<DashboardStats>("/dashboard/stats"),

  // Tickets
  getTickets: (filters: TicketFilters = {}) => {
    const params = new URLSearchParams();

    if (filters.q && filters.q.trim()) {
      params.set("q", filters.q.trim());
    }

    if (filters.status && filters.status.length > 0) {
      filters.status.forEach((st) => params.append("status", st));
    }

    if (filters.priority && filters.priority.length > 0) {
      filters.priority.forEach((pr) => params.append("priority", pr));
    }

    if (filters.assignee_id !== undefined && filters.assignee_id !== null && filters.assignee_id !== "") {
      params.set("assignee_id", String(filters.assignee_id));
    }

    if (filters.overdue !== undefined && filters.overdue !== null) {
      params.set("overdue", String(filters.overdue));
    }

    if (filters.sort) {
      params.set("sort", filters.sort);
    }

    if (filters.page) {
      params.set("page", String(filters.page));
    }

    if (filters.page_size) {
      params.set("page_size", String(filters.page_size));
    }

    const qs = params.toString();
    return request<PaginatedResponse<Ticket>>(`/tickets${qs ? `?${qs}` : ""}`);
  },

  getTicket: (id: number | string) => request<Ticket>(`/tickets/${id}`),

  createTicket: (data: TicketCreatePayload) =>
    request<Ticket>("/tickets", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateTicket: (id: number | string, data: TicketUpdatePayload) =>
    request<Ticket>(`/tickets/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Messages
  getTicketMessages: (id: number | string) => request<TicketMessage[]>(`/tickets/${id}/messages`),

  addTicketMessage: (id: number | string, data: MessageCreatePayload) =>
    request<TicketMessage>(`/tickets/${id}/messages`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Events
  getTicketEvents: (id: number | string) => request<TicketEvent[]>(`/tickets/${id}/events`),
};

