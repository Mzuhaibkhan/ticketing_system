import { TicketPriority, TicketStatus } from "./types";

export const STATUS_CONFIG: Record<
  TicketStatus,
  {
    label: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    badgeClass: string;
    icon: "none" | "clock" | "check";
  }
> = {
  open: {
    label: "Open",
    bgClass: "bg-blue-50 dark:bg-blue-950/40",
    textClass: "text-blue-700 dark:text-blue-300",
    borderClass: "border-blue-200 dark:border-blue-800",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
    icon: "none",
  },
  in_progress: {
    label: "In Progress",
    bgClass: "bg-amber-50 dark:bg-amber-950/40",
    textClass: "text-amber-700 dark:text-amber-300",
    borderClass: "border-amber-200 dark:border-amber-800",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
    icon: "none",
  },
  waiting_on_customer: {
    label: "Waiting on Customer",
    bgClass: "bg-purple-50 dark:bg-purple-950/40",
    textClass: "text-purple-700 dark:text-purple-300",
    borderClass: "border-purple-200 dark:border-purple-800",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
    icon: "clock",
  },
  resolved: {
    label: "Resolved",
    bgClass: "bg-emerald-50 dark:bg-emerald-950/40",
    textClass: "text-emerald-700 dark:text-emerald-300",
    borderClass: "border-emerald-200 dark:border-emerald-800",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
    icon: "check",
  },
};

export const PRIORITY_CONFIG: Record<
  TicketPriority,
  {
    label: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    badgeClass: string;
    chevronCount: 1 | 2;
    isUrgent: boolean;
  }
> = {
  low: {
    label: "Low",
    bgClass: "bg-slate-100 dark:bg-slate-800",
    textClass: "text-slate-700 dark:text-slate-300",
    borderClass: "border-slate-300 dark:border-slate-700",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    chevronCount: 1,
    isUrgent: false,
  },
  medium: {
    label: "Medium",
    bgClass: "bg-sky-50 dark:bg-sky-950/40",
    textClass: "text-sky-700 dark:text-sky-300",
    borderClass: "border-sky-200 dark:border-sky-800",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800",
    chevronCount: 1,
    isUrgent: false,
  },
  high: {
    label: "High",
    bgClass: "bg-orange-50 dark:bg-orange-950/40",
    textClass: "text-orange-700 dark:text-orange-300",
    borderClass: "border-orange-200 dark:border-orange-800",
    badgeClass: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800",
    chevronCount: 2,
    isUrgent: false,
  },
  urgent: {
    label: "Urgent",
    bgClass: "bg-rose-600 dark:bg-rose-700",
    textClass: "text-white",
    borderClass: "border-rose-600 dark:border-rose-700",
    badgeClass: "bg-rose-600 text-white border-rose-600 font-semibold shadow-xs",
    chevronCount: 2,
    isUrgent: true,
  },
};

export const QUERY_KEYS = {
  tickets: (filters?: Record<string, unknown>) => ["tickets", filters ?? {}],
  ticket: (id: number | string) => ["ticket", String(id)],
  messages: (id: number | string) => ["messages", String(id)],
  events: (id: number | string) => ["events", String(id)],
  dashboard: ["dashboard"],
  agents: ["agents"],
};

