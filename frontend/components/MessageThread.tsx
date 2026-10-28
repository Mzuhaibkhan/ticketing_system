import React from "react";
import { Mail, Lock, User } from "lucide-react";
import { TicketMessage } from "@/lib/types";
import { formatRelativeTime, formatExactTime } from "@/lib/date";

interface MessageThreadProps {
  messages: TicketMessage[];
  isLoading?: boolean;
}

export function MessageThread({ messages, isLoading = false }: MessageThreadProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-500 text-sm">
        No messages or internal notes yet. Use the composer below to start the conversation.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const isInternal = message.kind === "internal_note";

        if (isInternal) {
          // Yellow card, lock icon, dashed border, and internal note banner
          return (
            <div
              key={message.id}
              className="rounded-xl border border-dashed border-amber-300 dark:border-amber-700/80 bg-amber-50/70 dark:bg-amber-950/20 shadow-2xs overflow-hidden transition-all"
            >
              {/* Internal note header banner */}
              <div className="px-4 py-2 bg-amber-100/90 dark:bg-amber-900/40 border-b border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200 font-medium">
                <div className="flex items-center gap-1.5 font-semibold">
                  <Lock className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                  <span>Internal note — not visible to customer</span>
                </div>
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                  <span className="font-semibold">{message.author_name}</span>
                  <span>•</span>
                  <span
                    title={formatExactTime(message.created_at)}
                    className="cursor-help"
                  >
                    {formatRelativeTime(message.created_at)}
                  </span>
                </div>
              </div>

              {/* Message body */}
              <div className="p-4 text-sm text-amber-950 dark:text-amber-100 whitespace-pre-wrap leading-relaxed">
                {message.body}
              </div>
            </div>
          );
        }

        // Public reply: White card, envelope icon, "Reply to customer" label
        return (
          <div
            key={message.id}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden transition-all"
          >
            {/* Header */}
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold text-[11px]">
                  <Mail className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  <span>Reply to customer</span>
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  {message.author_name}
                </span>
              </div>

              <span
                title={formatExactTime(message.created_at)}
                className="cursor-help text-slate-500"
              >
                {formatRelativeTime(message.created_at)}
              </span>
            </div>

            {/* Message body */}
            <div className="p-4 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              {message.body}
            </div>
          </div>
        );
      })}
    </div>
  );
}

