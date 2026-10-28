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
      // Invalidate queries as required by PDF page 10:
      // "Every mutation invalidates the ticket, its events, the list and the dashboard."
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
        "rounded-xl border transition-all shadow-xs overflow-hidden",
        isNote
          ? "border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-950/20"
          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
      )}
    >
      {/* Tabs */}
      <div
        className={cn(
          "flex items-center border-b px-3 pt-2 gap-2 text-xs font-medium",
          isNote
            ? "border-amber-200 dark:border-amber-800/80 bg-amber-100/50 dark:bg-amber-900/30"
            : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40"
        )}
      >
        <button
          type="button"
          onClick={() => setActiveTab("public_reply")}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg transition-all border-b-2 -mb-[1px] font-semibold cursor-pointer",
            !isNote
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400 shadow-2xs"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          )}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Reply to customer</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("internal_note")}
          className={cn(
            "flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg transition-all border-b-2 -mb-[1px] font-semibold cursor-pointer",
            isNote
              ? "bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border-amber-600 dark:border-amber-400 shadow-2xs"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          )}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Internal note</span>
        </button>
      </div>

      {/* Internal note banner */}
      {isNote && (
        <div className="px-4 py-2 bg-amber-200/50 dark:bg-amber-900/40 border-b border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-1.5 font-medium">
          <Lock className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 flex-shrink-0" />
          <span>Internal note — visible only to agents and staff</span>
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
              ? "Write a private note for other support agents..."
              : "Type your public reply to the customer..."
          }
          className={cn(
            "w-full p-3 text-sm rounded-lg border focus:outline-hidden transition-colors resize-y min-h-[90px]",
            isNote
              ? "bg-white dark:bg-slate-900/80 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-100 placeholder:text-amber-700/50 focus:ring-2 focus:ring-amber-500"
              : "bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
          )}
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span>Author:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {actingAgent ? actingAgent.name : "System Agent"}
            </span>
            <span className="text-slate-400">•</span>
            <span>{body.length} / 10,000 characters</span>
          </div>

          <button
            type="submit"
            disabled={messageMutation.isPending || !body.trim()}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
              isNote
                ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20"
            )}
          >
            {messageMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Posting...</span>
              </>
            ) : isNote ? (
              <>
                <Lock className="w-4 h-4" />
                <span>Add internal note</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send reply</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

