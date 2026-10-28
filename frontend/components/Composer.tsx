"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail, Lock, Send, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import { MessageKind } from "@/lib/types";
import { useActingAgent } from "@/context/acting-agent-context";
import { cn } from "@/lib/utils";

interface ComposerProps {
  ticketId: number;
}

export function Composer({ ticketId }: ComposerProps) {
  const [activeTab, setActiveTab] = useState<MessageKind>("public_reply");
  const [body, setBody] = useState("");
  const { actingAgentId, actingAgent } = useActingAgent();
  const queryClient = useQueryClient();

  const isNote = activeTab === "internal_note";

  const messageMutation = useMutation({
    mutationFn: async () => {
      const trimmed = body.trim();
      if (!trimmed) {
        throw new Error("Message body cannot be empty");
      }
      return api.addTicketMessage(ticketId, {
        kind: activeTab,
        body: trimmed,
        author_id: actingAgentId,
      });
    },
    onSuccess: (newMessage) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ticket(ticketId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.messages(ticketId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events(ticketId) });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });

      setBody("");
      toast.success(
        newMessage.kind === "internal_note"
          ? "Internal note added"
          : "Public reply sent"
      );
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Failed to submit message");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) {
      toast.error("Please enter a message before sending");
      return;
    }
    messageMutation.mutate();
  };

  return (
    <div
      className={cn(
        "rounded-lg border transition-all duration-150 overflow-hidden shadow-xs",
        isNote
          ? "border-[#ff6e14] bg-[#1a1614]"
          : "border-[#2a2420] bg-[#201a18]"
      )}
    >
      {/* Tabs */}
      <div
        className={cn(
          "flex items-center border-b px-4 pt-2 gap-3 text-xs font-mono",
          isNote
            ? "border-[#ff6e14]/40 bg-[#251f1c]"
            : "border-[#2a2420] bg-[#1a1614]"
        )}
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("public_reply")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2.5 rounded-t-sm transition-all border-b-2 -mb-[1px] font-bold uppercase tracking-wider cursor-pointer",
            !isNote
              ? "bg-[#201a18] text-[#e3e3db] border-[#e3e3db]"
              : "border-transparent text-[#8c7e77] hover:text-[#e3e3db]"
          )}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Reply to customer</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("internal_note")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2.5 rounded-t-sm transition-all border-b-2 -mb-[1px] font-bold uppercase tracking-wider cursor-pointer",
            isNote
              ? "bg-[#1a1614] text-[#ff6e14] border-[#ff6e14]"
              : "border-transparent text-[#8c7e77] hover:text-[#e3e3db]"
          )}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Internal note</span>
        </button>
      </div>

      {/* Internal note banner */}
      {isNote && (
        <div
          className="px-4 py-2 bg-[#ff6e14]/10 border-b border-[#ff6e14]/30 text-xs font-mono text-[#ff6e14] flex items-center gap-2 font-bold uppercase tracking-wider"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <Lock className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Internal note — private to staff only</span>
        </div>
      )}

      {/* Composer form */}
      <form onSubmit={handleSubmit} className="p-4 space-y-3">
        <textarea
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          disabled={messageMutation.isPending}
          placeholder={
            isNote
              ? "Write private internal note for other agents..."
              : "Type public reply to customer..."
          }
          className={cn(
            "w-full p-4 text-xs font-mono rounded-md border focus:outline-hidden transition-colors resize-y min-h-[90px]",
            isNote
              ? "bg-[#1a1614] border-[#ff6e14]/40 text-[#e3e3db] placeholder:text-[#8c7e77] focus:border-[#ff6e14]"
              : "bg-[#1a1614] border-[#352f2b] text-[#e3e3db] placeholder:text-[#8c7e77] focus:border-[#ff6e14]"
          )}
          style={{ fontFamily: "var(--font-mono)" }}
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
          <div
            className="text-xs font-mono text-[#8c7e77] flex items-center gap-2"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <span>AUTHOR:</span>
            <span className="font-bold text-[#e3e3db]">
              {actingAgent ? actingAgent.name.toUpperCase() : "SYSTEM AGENT"}
            </span>
            <span>•</span>
            <span>{body.length} / 10,000 CHARS</span>
          </div>

          <button
            type="submit"
            disabled={messageMutation.isPending || !body.trim()}
            className={cn(
              "inline-flex items-center gap-2 px-5 py-2.5 rounded-sm text-xs font-mono font-bold tracking-widest uppercase transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
              isNote
                ? "bg-[#ff6e14] hover:bg-[#e3e3db] text-[#1a1614]"
                : "bg-[#e3e3db] hover:bg-[#ff6e14] text-[#1a1614]"
            )}
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {messageMutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>POSTING...</span>
              </>
            ) : isNote ? (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>ADD INTERNAL NOTE</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>SEND REPLY</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
