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
      return <PlusCircle className="w-3.5 h-3.5 text-indigo-500" />;
    case "status_changed":
      return <RefreshCw className="w-3.5 h-3.5 text-blue-500" />;
    case "priority_changed":
      return <SlidersHorizontal className="w-3.5 h-3.5 text-orange-500" />;
    case "assignee_changed":
      return <UserCheck className="w-3.5 h-3.5 text-purple-500" />;
    case "reply_added":
      return <Mail className="w-3.5 h-3.5 text-sky-500" />;
    case "note_added":
      return <Lock className="w-3.5 h-3.5 text-amber-500" />;
    case "fields_updated":
      return <Edit className="w-3.5 h-3.5 text-slate-500" />;
    default:
      return <History className="w-3.5 h-3.5 text-slate-400" />;
  }
}

function formatEventMessage(event: TicketEvent): string {
  switch (event.event_type) {
    case "created":
      return event.new_value || "Ticket created";
    case "status_changed":
      return `Status changed from ${event.old_value} to ${event.new_value}`;
    case "priority_changed":
      return `Priority changed from ${event.old_value} to ${event.new_value}`;
    case "assignee_changed":
      return `Assignee changed: ${event.old_value} → ${event.new_value}`;
    case "reply_added":
      return `Public reply posted`;
    case "note_added":
      return `Internal note posted`;
    case "fields_updated":
      return event.new_value || "Ticket details updated";
    default:
      return event.new_value || "Event occurred";
  }
}

export function ActivityTimeline({ events, isLoading = false }: ActivityTimelineProps) {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Activity History
        </h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" />
          <span>Activity Timeline</span>
        </h3>
        <span className="text-xs text-slate-400">{events.length} events</span>
      </div>

      {events.length === 0 ? (
        <p className="text-xs text-slate-400 italic">No activity recorded yet.</p>
      ) : (
        <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {events.map((ev) => (
            <div key={ev.id} className="relative flex items-start gap-2.5 text-xs">
              {/* Dot / Icon */}
              <div className="absolute -left-4 top-0.5 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 flex items-center justify-center">
                {getEventIcon(ev.event_type)}
              </div>

              {/* Event content */}
              <div className="flex-1 min-w-0 pl-1.5">
                <p className="font-medium text-slate-800 dark:text-slate-200 leading-snug">
                  {formatEventMessage(ev)}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">
                    {ev.actor_name || "System"}
                  </span>
                  <span>•</span>
                  <span
                    title={formatExactTime(ev.created_at)}
                    className="cursor-help"
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

