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
            className="p-5 rounded-lg border border-[#2a2420] bg-[#201a18] animate-pulse space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-32 bg-[#2a2420] rounded" />
              <div className="h-3 w-16 bg-[#2a2420] rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-[#2a2420] rounded" />
              <div className="h-3 w-3/4 bg-[#2a2420] rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div
        className="p-8 text-center bg-[#201a18] rounded-lg border border-dashed border-[#352f2b] text-[#8c7e77] text-xs font-mono"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        NO MESSAGES OR INTERNAL NOTES YET // POST THE FIRST UPDATE BELOW.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const isInternal = message.kind === "internal_note";

        if (isInternal) {
          // Internal note: Dark background with prominent orange border and warning header
          return (
            <div
              key={message.id}
              className="rounded-lg border-l-4 border-l-[#ff6e14] border-t border-r border-b border-[#352f2b] bg-[#1a1614] shadow-xs overflow-hidden"
            >
              {/* Internal note header */}
              <div
                className="px-4 py-2.5 bg-[#251f1c] border-b border-[#2a2420] flex items-center justify-between text-xs font-mono"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                <div className="flex items-center gap-2 text-[#ff6e14] font-bold uppercase tracking-wider">
                  <Lock className="w-3.5 h-3.5" />
                  <span>INTERNAL NOTE // STAFF ONLY</span>
                </div>
                <div className="flex items-center gap-2 text-[#8c7e77]">
                  <span className="font-semibold text-[#e3e3db]">{message.author_name}</span>
                  <span>•</span>
                  <span title={formatExactTime(message.created_at)} className="cursor-help">
                    {formatRelativeTime(message.created_at)}
                  </span>
                </div>
              </div>

              {/* Message body */}
              <div className="p-4 text-xs font-mono text-[#e3e3db] whitespace-pre-wrap leading-relaxed">
                {message.body}
              </div>
            </div>
          );
        }

        // Public reply: Card with customer-visible header
        return (
          <div
            key={message.id}
            className="rounded-lg border border-[#2a2420] bg-[#201a18] shadow-xs overflow-hidden"
          >
            {/* Header */}
            <div
              className="px-4 py-2.5 bg-[#1a1614] border-b border-[#2a2420] flex items-center justify-between text-xs font-mono"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-[#e3e3db] text-[#1a1614] font-bold text-[10px] uppercase tracking-wider">
                  <Mail className="w-3 h-3 text-[#1a1614]" />
                  <span>PUBLIC REPLY</span>
                </span>
                <span className="font-medium text-[#8c7e77] flex items-center gap-1">
                  <User className="w-3 h-3 text-[#8c7e77]" />
                  {message.author_name}
                </span>
              </div>

              <span
                title={formatExactTime(message.created_at)}
                className="cursor-help text-[#8c7e77]"
              >
                {formatRelativeTime(message.created_at)}
              </span>
            </div>

            {/* Message body */}
            <div className="p-4 text-xs font-mono text-[#e3e3db] whitespace-pre-wrap leading-relaxed">
              {message.body}
            </div>
          </div>
        );
      })}
    </div>
  );
}
