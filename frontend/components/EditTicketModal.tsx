"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, Loader2, Save } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import { Ticket } from "@/lib/types";
import { useActingAgent } from "@/context/acting-agent-context";

interface EditTicketModalProps {
  ticket: Ticket;
  isOpen: boolean;
  onClose: () => void;
}

export function EditTicketModal({ ticket, isOpen, onClose }: EditTicketModalProps) {
  const queryClient = useQueryClient();
  const { actingAgentId } = useActingAgent();

  const [subject, setSubject] = useState(ticket.subject);
  const [customerName, setCustomerName] = useState(ticket.customer_name || "");
  const [customerEmail, setCustomerEmail] = useState(ticket.customer_email || "");
  const [description, setDescription] = useState(ticket.description);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const editMutation = useMutation({
    mutationFn: async () => {
      const trimmedSubject = subject.trim();
      const trimmedDesc = description.trim();
      const trimmedName = customerName.trim() || null;
      const trimmedEmail = customerEmail.trim() || null;

      if (!trimmedSubject) {
        throw new Error("Subject cannot be empty");
      }
      if (!trimmedDesc) {
        throw new Error("Description cannot be empty");
      }
      if (!trimmedName && !trimmedEmail) {
        throw new Error("At least one customer identifier (name or email) is required");
      }

      return api.updateTicket(ticket.id, {
        subject: trimmedSubject,
        customer_name: trimmedName,
        customer_email: trimmedEmail,
        description: trimmedDesc,
        actor_id: actingAgentId,
        expected_version: ticket.version,
      });
    },
    onSuccess: (updatedTicket) => {
      queryClient.setQueryData(QUERY_KEYS.ticket(ticket.id), updatedTicket);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events(ticket.id) });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });

      toast.success("Ticket details updated");
      onClose();
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError && err.status === 409) {
        setErrorMsg("Version conflict: this ticket was modified by another agent. Please refresh.");
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ticket(ticket.id) });
      } else if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Failed to update ticket details");
      }
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#1a1614] border border-[#352f2b] rounded-lg w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-[#e3e3db]">
        <div className="px-6 py-4 border-b border-[#2a2420] flex items-center justify-between">
          <h3
            className="font-display uppercase text-2xl tracking-tight text-[#e3e3db]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            EDIT TICKET // #{ticket.id}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8c7e77] hover:text-[#ff6e14] rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setErrorMsg(null);
            editMutation.mutate();
          }}
          className="p-6 space-y-4 font-mono text-xs"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {errorMsg && (
            <div className="p-3 rounded-md bg-[#ff6e14]/10 text-[#ff6e14] border border-[#ff6e14]">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block uppercase tracking-wider text-[#8c7e77] mb-1">
              Subject *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 bg-[#201a18] border border-[#352f2b] rounded-md text-[#e3e3db] focus:border-[#ff6e14] focus:outline-hidden"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block uppercase tracking-wider text-[#8c7e77] mb-1">
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 bg-[#201a18] border border-[#352f2b] rounded-md text-[#e3e3db] focus:border-[#ff6e14] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block uppercase tracking-wider text-[#8c7e77] mb-1">
                Customer Email
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[#201a18] border border-[#352f2b] rounded-md text-[#e3e3db] focus:border-[#ff6e14] focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block uppercase tracking-wider text-[#8c7e77] mb-1">
              Description *
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#201a18] border border-[#352f2b] rounded-md text-[#e3e3db] focus:border-[#ff6e14] focus:outline-hidden"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#2a2420]">
            <button
              type="button"
              onClick={onClose}
              disabled={editMutation.isPending}
              className="px-4 py-2 uppercase tracking-wider text-[#8c7e77] hover:text-[#e3e3db] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editMutation.isPending}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#ff6e14] hover:bg-[#e3e3db] text-[#1a1614] font-bold uppercase tracking-widest rounded-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {editMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
