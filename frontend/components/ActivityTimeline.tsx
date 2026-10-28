import React from "react";
import {
  PlusCircle,
  RefreshCw,
  SlidersHorizontal,
  UserCheck,
  Mail,
  Lock,
  Edit,
  History,
} from "lucide-react";
import { EventType, TicketEvent } from "@/lib/types";
import { formatRelativeTime, formatExactTime } from "@/lib/date";

interface ActivityTimelineProps {
  events: TicketEvent[];
  isLoading?: boolean;
}

function getEventIcon(type: EventType) {
  switch (type) {
    case "created":
      return <PlusCircle className="w-3.5 h-3.5 text-[#ff6e14]" />;
    case "status_changed":
      return <RefreshCw className="w-3.5 h-3.5 text-[#ff6e14]" />;
    case "priority_changed":
      return <SlidersHorizontal className="w-3.5 h-3.5 text-[#ff6e14]" />;
    case "assignee_changed":
      return <UserCheck className="w-3.5 h-3.5 text-[#ff6e14]" />;
    case "reply_added":
      return <Mail className="w-3.5 h-3.5 text-[#e3e3db]" />;
    case "note_added":
      return <Lock className="w-3.5 h-3.5 text-[#ff6e14]" />;
    case "fields_updated":
      return <Edit className="w-3.5 h-3.5 text-[#8c7e77]" />;
    default:
      return <History className="w-3.5 h-3.5 text-[#8c7e77]" />;
  }
}

function formatEventMessage(event: TicketEvent): string {
  switch (event.event_type) {
    case "created":
      return event.new_value || "Ticket created";
    case "status_changed":
      return `Status changed: ${event.old_value?.toUpperCase()} → ${event.new_value?.toUpperCase()}`;
    case "priority_changed":
      return `Priority changed: ${event.old_value?.toUpperCase()} → ${event.new_value?.toUpperCase()}`;
    case "assignee_changed":
      return `Assignee changed: ${event.old_value} → ${event.new_value}`;
    case "reply_added":
      return "Public reply posted";
    case "note_added":
      return "Internal note posted";
    case "fields_updated":
      return event.new_value || "Ticket details updated";
    default:
      return event.new_value || "Event occurred";
  }
}

export function ActivityTimeline({ events, isLoading = false }: ActivityTimelineProps) {
  if (isLoading) {
    return (
      <div className="bg-[#201a18] border border-[#2a2420] rounded-lg p-6 shadow-sm space-y-4">
        <h3
          className="text-xl font-display uppercase tracking-tight text-[#e3e3db]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          ACTIVITY TIMELINE //
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-4 h-4 rounded-full bg-[#2a2420]" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-32 bg-[#2a2420] rounded" />
                <div className="h-3 w-48 bg-[#2a2420] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#201a18] border border-[#2a2420] rounded-lg p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-[#2a2420] pb-3">
        <h3
          className="text-xl font-display uppercase tracking-tight text-[#e3e3db]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          ACTIVITY TIMELINE //
        </h3>
        <span
          className="text-xs font-mono text-[#8c7e77]"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {events.length} EVENTS
        </span>
      </div>

      {events.length === 0 ? (
        <p
          className="text-xs font-mono text-[#8c7e77] italic"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          NO ACTIVITY RECORDED YET.
        </p>
      ) : (
        <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#2a2420]">
          {events.map((ev) => (
            <div key={ev.id} className="relative flex items-start gap-2.5 text-xs font-mono">
              {/* Dot / Icon */}
              <div className="absolute -left-4 top-0.5 w-4 h-4 rounded-full bg-[#1a1614] border border-[#ff6e14] flex items-center justify-center">
                {getEventIcon(ev.event_type)}
              </div>

              {/* Event content */}
              <div className="flex-1 min-w-0 pl-2">
                <p className="font-semibold text-[#e3e3db] leading-snug">
                  {formatEventMessage(ev)}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-[#8c7e77] mt-0.5">
                  <span className="font-bold text-[#e3e3db]">
                    {ev.actor_name || "SYSTEM"}
                  </span>
                  <span>•</span>
                  <span
                    title={formatExactTime(ev.created_at)}
                    className="cursor-help hover:text-[#ff6e14]"
                  >
                    {formatRelativeTime(ev.created_at)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
