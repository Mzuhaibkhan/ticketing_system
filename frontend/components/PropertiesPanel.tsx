"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Edit3, Lock } from "lucide-react";
import { Ticket, TicketPriority, TicketStatus } from "@/lib/types";
import { api, ApiError } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import { useActingAgent } from "@/context/acting-agent-context";
import { EditTicketModal } from "./EditTicketModal";

interface PropertiesPanelProps {
  ticket: Ticket;
}

export function PropertiesPanel({ ticket }: PropertiesPanelProps) {
  const queryClient = useQueryClient();
  const { agents, actingAgent, actingAgentId } = useActingAgent();

  const [selectedStatus, setSelectedStatus] = useState<TicketStatus>(ticket.status);
  const [selectedPriority, setSelectedPriority] = useState<TicketPriority>(ticket.priority);
  const [selectedAssignee, setSelectedAssignee] = useState<string>(
    ticket.assignee_id ? String(ticket.assignee_id) : ""
  );

  const [prevTicket, setPrevTicket] = useState(ticket);
  if (
    prevTicket.status !== ticket.status ||
    prevTicket.priority !== ticket.priority ||
    prevTicket.assignee_id !== ticket.assignee_id
  ) {
    setPrevTicket(ticket);
    setSelectedStatus(ticket.status);
    setSelectedPriority(ticket.priority);
    setSelectedAssignee(ticket.assignee_id ? String(ticket.assignee_id) : "");
  }

  const [savingField, setSavingField] = useState<"status" | "priority" | "assignee" | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Status mutation with optimistic locking
  const statusMutation = useMutation({
    mutationFn: async (newStatus: TicketStatus) => {
      setSavingField("status");
      return api.updateTicket(ticket.id, {
        status: newStatus,
        actor_id: actingAgentId,
        expected_version: ticket.version,
      });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(QUERY_KEYS.ticket(ticket.id), updated);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events(ticket.id) });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      toast.success(`Status updated to ${updated.status.toUpperCase()}`);
    },
    onError: (err: unknown) => {
      setSelectedStatus(ticket.status);
      if (err instanceof ApiError && err.status === 409) {
        toast.error("Version conflict: this ticket was modified by someone else. Refreshed to latest.");
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ticket(ticket.id) });
      } else {
        const msg = err instanceof ApiError ? err.message : "Failed to update status";
        toast.error(msg);
      }
    },
    onSettled: () => {
      setSavingField(null);
    },
  });

  // Priority mutation with optimistic locking
  const priorityMutation = useMutation({
    mutationFn: async (newPriority: TicketPriority) => {
      setSavingField("priority");
      return api.updateTicket(ticket.id, {
        priority: newPriority,
        actor_id: actingAgentId,
        expected_version: ticket.version,
      });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(QUERY_KEYS.ticket(ticket.id), updated);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events(ticket.id) });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      toast.success(`Priority updated to ${updated.priority.toUpperCase()}`);
    },
    onError: (err: unknown) => {
      setSelectedPriority(ticket.priority);
      if (err instanceof ApiError && err.status === 409) {
        toast.error("Version conflict: this ticket was modified by someone else. Refreshed to latest.");
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ticket(ticket.id) });
      } else {
        const msg = err instanceof ApiError ? err.message : "Failed to update priority";
        toast.error(msg);
      }
    },
    onSettled: () => {
      setSavingField(null);
    },
  });

  // Assignee mutation with optimistic locking & role enforcement
  const assigneeMutation = useMutation({
    mutationFn: async (newAssigneeId: string) => {
      setSavingField("assignee");
      const aid = newAssigneeId ? Number(newAssigneeId) : null;
      return api.updateTicket(ticket.id, {
        assignee_id: aid,
        actor_id: actingAgentId,
        expected_version: ticket.version,
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
      setSelectedAssignee(ticket.assignee_id ? String(ticket.assignee_id) : "");
      if (err instanceof ApiError && err.status === 409) {
        toast.error("Version conflict: this ticket was modified by someone else. Refreshed to latest.");
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ticket(ticket.id) });
      } else if (err instanceof ApiError && err.status === 403) {
        toast.error("Permission denied: Agents cannot reassign tickets assigned to others.");
      } else {
        const msg = err instanceof ApiError ? err.message : "Failed to reassign ticket";
        toast.error(msg);
      }
    },
    onSettled: () => {
      setSavingField(null);
    },
  });

  // Role check: An Agent cannot reassign a ticket already owned by another agent
  const isReassignLocked =
    actingAgent?.role === "agent" &&
    ticket.assignee_id !== null &&
    ticket.assignee_id !== actingAgent?.id;

  return (
    <div className="bg-[#201a18] border border-[#2a2420] rounded-lg p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-[#2a2420] pb-3">
        <h3
          className="text-xl font-display uppercase tracking-tight text-[#e3e3db]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          PROPERTIES //
        </h3>
        <button
          type="button"
          onClick={() => setIsEditModalOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#ff6e14] hover:text-[#e3e3db] transition-colors cursor-pointer"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>EDIT</span>
        </button>
      </div>

      {/* Status select */}
      <div className="space-y-1.5">
        <div
          className="flex items-center justify-between text-xs font-mono text-[#8c7e77] uppercase tracking-wider"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <label htmlFor="prop-status">STATUS</label>
          {savingField === "status" && (
            <span className="flex items-center gap-1 text-[11px] text-[#ff6e14]">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>SAVING...</span>
            </span>
          )}
        </div>
        <select
          id="prop-status"
          value={selectedStatus}
          disabled={savingField === "status"}
          onChange={(e) => {
            const val = e.target.value as TicketStatus;
            setSelectedStatus(val);
            statusMutation.mutate(val);
          }}
          className="w-full text-xs font-mono bg-[#1a1614] border border-[#352f2b] rounded-md px-3 py-2.5 text-[#e3e3db] focus:outline-none focus:border-[#ff6e14] cursor-pointer disabled:opacity-60 uppercase"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <option value="open" className="bg-[#1a1614]">OPEN</option>
          <option value="in_progress" className="bg-[#1a1614]">IN PROGRESS</option>
          <option value="waiting_on_customer" className="bg-[#1a1614]">WAITING ON CUSTOMER</option>
          <option value="resolved" className="bg-[#1a1614]">RESOLVED</option>
        </select>
      </div>

      {/* Priority select */}
      <div className="space-y-1.5">
        <div
          className="flex items-center justify-between text-xs font-mono text-[#8c7e77] uppercase tracking-wider"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <label htmlFor="prop-priority">PRIORITY</label>
          {savingField === "priority" && (
            <span className="flex items-center gap-1 text-[11px] text-[#ff6e14]">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>SAVING...</span>
            </span>
          )}
        </div>
        <select
          id="prop-priority"
          value={selectedPriority}
          disabled={savingField === "priority"}
          onChange={(e) => {
            const val = e.target.value as TicketPriority;
            setSelectedPriority(val);
            priorityMutation.mutate(val);
          }}
          className="w-full text-xs font-mono bg-[#1a1614] border border-[#352f2b] rounded-md px-3 py-2.5 text-[#e3e3db] focus:outline-none focus:border-[#ff6e14] cursor-pointer disabled:opacity-60 uppercase"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <option value="low" className="bg-[#1a1614]">LOW</option>
          <option value="medium" className="bg-[#1a1614]">MEDIUM</option>
          <option value="high" className="bg-[#1a1614]">HIGH</option>
          <option value="urgent" className="bg-[#1a1614]">URGENT</option>
        </select>
      </div>

      {/* Assignee select */}
      <div className="space-y-1.5">
        <div
          className="flex items-center justify-between text-xs font-mono text-[#8c7e77] uppercase tracking-wider"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <label htmlFor="prop-assignee">ASSIGNEE</label>
          {savingField === "assignee" ? (
            <span className="flex items-center gap-1 text-[11px] text-[#ff6e14]">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>SAVING...</span>
            </span>
          ) : isReassignLocked ? (
            <span className="flex items-center gap-1 text-[10px] text-amber-400 font-bold">
              <Lock className="w-3 h-3" />
              <span>ADMIN REASSIGN ONLY</span>
            </span>
          ) : null}
        </div>
        <select
          id="prop-assignee"
          value={selectedAssignee}
          disabled={savingField === "assignee" || isReassignLocked}
          onChange={(e) => {
            const val = e.target.value;
            setSelectedAssignee(val);
            assigneeMutation.mutate(val);
          }}
          className="w-full text-xs font-mono bg-[#1a1614] border border-[#352f2b] rounded-md px-3 py-2.5 text-[#e3e3db] focus:outline-none focus:border-[#ff6e14] cursor-pointer disabled:opacity-60 uppercase"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <option value="" className="bg-[#1a1614]">UNASSIGNED</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id} className="bg-[#1a1614]">
              {agent.name.toUpperCase()} [{agent.role.toUpperCase()}]
            </option>
          ))}
        </select>
      </div>

      {/* Metadata summary */}
      <div
        className="pt-4 border-t border-[#2a2420] space-y-2 text-xs font-mono text-[#8c7e77]"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <div className="flex items-center justify-between">
          <span>VERSION:</span>
          <span className="font-bold text-[#e3e3db]">v{ticket.version}</span>
        </div>

        <div className="flex items-center justify-between">
          <span>SLA TARGET:</span>
          <span className="font-bold text-[#e3e3db]">{ticket.sla_target_hours}H FIRST-RESPONSE</span>
        </div>

        <div className="flex items-center justify-between">
          <span>SLA STATUS:</span>
          {ticket.sla_breached ? (
            <span className="text-red-400 font-bold">BREACHED</span>
          ) : ticket.first_responded_at ? (
            <span className="text-emerald-400 font-bold">MET</span>
          ) : (
            <span className="text-[#e3e3db]">IN PROGRESS</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span>TICKET AGE:</span>
          <span className="font-bold text-[#e3e3db]">{ticket.age_hours} HOURS</span>
        </div>

        {ticket.resolved_at && (
          <div className="flex items-center justify-between text-[#ff6e14]">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>RESOLVED:</span>
            </span>
            <span className="font-bold">
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
