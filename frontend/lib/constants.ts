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
    bgClass: "bg-[#e3e3db]",
    textClass: "text-[#1a1614]",
    borderClass: "border-[#ccccc4]",
    badgeClass: "bg-[#e3e3db] text-[#1a1614] border-[#ccccc4] font-semibold",
    icon: "none",
  },
  in_progress: {
    label: "In Progress",
    bgClass: "bg-[#ff6e14]",
    textClass: "text-[#1a1614]",
    borderClass: "border-[#ff6e14]",
    badgeClass: "bg-[#ff6e14] text-[#1a1614] border-[#ff6e14] font-bold shadow-xs",
    icon: "none",
  },
  waiting_on_customer: {
    label: "Waiting",
    bgClass: "bg-[#251f1c]",
    textClass: "text-[#8c7e77]",
    borderClass: "border-[#352f2b]",
    badgeClass: "bg-[#251f1c] text-[#8c7e77] border-[#352f2b]",
    icon: "clock",
  },
  resolved: {
    label: "Resolved",
    bgClass: "bg-[#201a18]",
    textClass: "text-[#e3e3db]",
    borderClass: "border-[#352f2b]",
    badgeClass: "bg-[#201a18] text-[#e3e3db] border-[#352f2b]",
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
    bgClass: "bg-[#251f1c]",
    textClass: "text-[#8c7e77]",
    borderClass: "border-[#352f2b]",
    badgeClass: "bg-[#251f1c] text-[#8c7e77] border-[#352f2b]",
    chevronCount: 1,
    isUrgent: false,
  },
  medium: {
    label: "Medium",
    bgClass: "bg-[#e3e3db]",
    textClass: "text-[#1a1614]",
    borderClass: "border-[#ccccc4]",
    badgeClass: "bg-[#e3e3db] text-[#1a1614] border-[#ccccc4]",
    chevronCount: 1,
    isUrgent: false,
  },
  high: {
    label: "High",
    bgClass: "bg-[#ff6e14]/20",
    textClass: "text-[#ff6e14]",
    borderClass: "border-[#ff6e14]/40",
    badgeClass: "bg-[#ff6e14]/20 text-[#ff6e14] border-[#ff6e14]/40 font-semibold",
    chevronCount: 2,
    isUrgent: false,
  },
  urgent: {
    label: "Urgent",
    bgClass: "bg-[#ff6e14]",
    textClass: "text-[#1a1614]",
    borderClass: "border-[#ff6e14]",
    badgeClass: "bg-[#ff6e14] text-[#1a1614] border-[#ff6e14] font-bold shadow-xs",
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
