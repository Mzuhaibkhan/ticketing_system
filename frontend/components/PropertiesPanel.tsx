"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Edit3, User, ShieldAlert, CheckCircle2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import { Ticket, TicketPriority, TicketStatus } from "@/lib/types";
import { useActingAgent } from "@/context/acting-agent-context";
import { EditTicketModal } from "./EditTicketModal";

interface PropertiesPanelProps {
  ticket: Ticket;
}

export function PropertiesPanel({ ticket }: PropertiesPanelProps) {
  const queryClient = useQueryClient();
  const { agents, actingAgentId } = useActingAgent();

  // Optimistic/local state for selects to support revert on error
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus>(ticket.status);
  const [selectedPriority, setSelectedPriority] = useState<TicketPriority>(ticket.priority);
  const [selectedAssignee, setSelectedAssignee] = useState<string>(
    ticket.assignee_id ? String(ticket.assignee_id) : ""
  );

  // Sync if ticket changes from other sources
  React.useEffect(() => {
    setSelectedStatus(ticket.status);
  }, [ticket.status]);

  React.useEffect(() => {
    setSelectedPriority(ticket.priority);
  }, [ticket.priority]);

  React.useEffect(() => {
    setSelectedAssignee(ticket.assignee_id ? String(ticket.assignee_id) : "");
  }, [ticket.assignee_id]);

  const [savingField, setSavingField] = useState<"status" | "priority" | "assignee" | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: async (newStatus: TicketStatus) => {
      setSavingField("status");
      return api.updateTicket(ticket.id, {
        status: newStatus,
        actor_id: actingAgentId,
      });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(QUERY_KEYS.ticket(ticket.id), updated);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events(ticket.id) });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      toast.success(`Status updated to ${updated.status}`);
    },
    onError: (err: unknown) => {
      // Revert select on failure
      setSelectedStatus(ticket.status);
      const msg = err instanceof ApiError ? err.message : "Failed to update status";
      toast.error(msg);
    },
    onSettled: () => {
      setSavingField(null);
    },
  });

  // Priority mutation
  const priorityMutation = useMutation({
    mutationFn: async (newPriority: TicketPriority) => {
      setSavingField("priority");
      return api.updateTicket(ticket.id, {
        priority: newPriority,
        actor_id: actingAgentId,
      });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(QUERY_KEYS.ticket(ticket.id), updated);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events(ticket.id) });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      toast.success(`Priority updated to ${updated.priority}`);
    },
    onError: (err: unknown) => {
      // Revert select on failure
      setSelectedPriority(ticket.priority);
      const msg = err instanceof ApiError ? err.message : "Failed to update priority";
      toast.error(msg);
    },
    onSettled: () => {
      setSavingField(null);
    },
  });

  // Assignee mutation
  const assigneeMutation = useMutation({
    mutationFn: async (newAssigneeId: string) => {
      setSavingField("assignee");
      const aid = newAssigneeId ? Number(newAssigneeId) : null;
      return api.updateTicket(ticket.id, {
        assignee_id: aid,
        actor_id: actingAgentId,
      });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(QUERY_KEYS.ticket(ticket.id), updated);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events(ticket.id) });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      toast.success(
        updated.assignee ? `Assigned to ${updated.assignee.name}` : "Ticket unassigned"
      );
    },
    onError: (err: unknown) => {
      // Revert select on failure
      setSelectedAssignee(ticket.assignee_id ? String(ticket.assignee_id) : "");
      const msg = err instanceof ApiError ? err.message : "Failed to reassign ticket";
      toast.error(msg);
    },
    onSettled: () => {
      setSavingField(null);
    },
  });

  const handleStatusChange = (val: TicketStatus) => {
    setSelectedStatus(val);
    statusMutation.mutate(val);
  };

  const handlePriorityChange = (val: TicketPriority) => {
    setSelectedPriority(val);
    priorityMutation.mutate(val);
  };

  const handleAssigneeChange = (val: string) => {
    setSelectedAssignee(val);
    assigneeMutation.mutate(val);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Properties
        </h3>
        <button
          type="button"
          onClick={() => setIsEditModalOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit details</span>
        </button>
      </div>

      {/* Status select */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
          <label htmlFor="prop-status">Status</label>
          {savingField === "status" && (
            <span className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Saving...</span>
            </span>
          )}
        </div>
        <select
          id="prop-status"
          value={selectedStatus}
          disabled={savingField === "status"}
          onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
          className="w-full text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-60"
        >
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="waiting_on_customer">Waiting on Customer</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Priority select */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
          <label htmlFor="prop-priority">Priority</label>
          {savingField === "priority" && (
            <span className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Saving...</span>
            </span>
          )}
        </div>
        <select
          id="prop-priority"
          value={selectedPriority}
          disabled={savingField === "priority"}
          onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
          className="w-full text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-60"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {/* Assignee select */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
          <label htmlFor="prop-assignee">Assignee</label>
          {savingField === "assignee" && (
            <span className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Saving...</span>
            </span>
          )}
        </div>
        <select
          id="prop-assignee"
          value={selectedAssignee}
          disabled={savingField === "assignee"}
          onChange={(e) => handleAssigneeChange(e.target.value)}
          className="w-full text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-60"
        >
          <option value="">Unassigned</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name} ({agent.role})
            </option>
          ))}
        </select>
      </div>

      {/* Metadata summary */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center justify-between">
          <span>Ticket Age:</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {ticket.age_hours} hours
          </span>
        </div>
        {ticket.resolved_at && (
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Resolved At:</span>
            </span>
            <span className="font-semibold">
              {new Date(ticket.resolved_at).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* Modal for full editing */}
      <EditTicketModal
        ticket={ticket}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
}

