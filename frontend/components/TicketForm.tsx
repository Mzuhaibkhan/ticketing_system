"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Send } from "lucide-react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import { TicketPriority, TicketStatus } from "@/lib/types";
import { useActingAgent } from "@/context/acting-agent-context";

// Zod schema matching backend constraints
const ticketSchema = z
  .object({
    subject: z
      .string()
      .trim()
      .min(1, "Subject is required")
      .max(200, "Subject must not exceed 200 characters"),
    customer_name: z
      .string()
      .trim()
      .max(120, "Customer name must not exceed 120 characters")
      .optional()
      .or(z.literal("")),
    customer_email: z
      .string()
      .trim()
      .email("Please provide a valid email address")
      .optional()
      .or(z.literal("")),
    description: z
      .string()
      .trim()
      .min(1, "Description is required")
      .max(5000, "Description must not exceed 5000 characters"),
    priority: z.enum(["low", "medium", "high", "urgent"]),
    status: z.enum(["open", "in_progress", "waiting_on_customer", "resolved"]),
    assignee_id: z.string().optional(),
  })
  .refine(
    (data) => {
      const hasName = Boolean(data.customer_name && data.customer_name.trim().length > 0);
      const hasEmail = Boolean(data.customer_email && data.customer_email.trim().length > 0);
      return hasName || hasEmail;
    },
    {
      message: "At least one customer identifier (name or email) is required",
      path: ["customer_email"],
    }
  );

type TicketFormData = z.infer<typeof ticketSchema>;

export function TicketForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { agents, actingAgentId } = useActingAgent();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      subject: "",
      customer_name: "",
      customer_email: "",
      description: "",
      priority: "medium",
      status: "open",
      assignee_id: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: TicketFormData) => {
      const payload = {
        subject: formData.subject.trim(),
        customer_name: formData.customer_name?.trim() || null,
        customer_email: formData.customer_email?.trim() || null,
        description: formData.description.trim(),
        priority: formData.priority as TicketPriority,
        status: formData.status as TicketStatus,
        assignee_id: formData.assignee_id ? Number(formData.assignee_id) : null,
        actor_id: actingAgentId,
      };
      return api.createTicket(payload);
    },
    onSuccess: (newTicket) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });

      toast.success(`Ticket #${newTicket.id} created successfully!`);
      router.push(`/tickets/${newTicket.id}`);
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        setServerError(err.message);

        if (err.details && err.details.length > 0) {
          err.details.forEach((item) => {
            if (
              item.field === "subject" ||
              item.field === "customer_name" ||
              item.field === "customer_email" ||
              item.field === "description" ||
              item.field === "priority" ||
              item.field === "status" ||
              item.field === "assignee_id"
            ) {
              setError(item.field as keyof TicketFormData, {
                type: "server",
                message: item.message,
              });
            } else if (item.field === "customer") {
              setError("customer_email", {
                type: "server",
                message: item.message,
              });
            }
          });
        }
      } else if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError("Failed to create ticket. Please verify inputs and try again.");
      }
    },
  });

  const onSubmit = (data: TicketFormData) => {
    setServerError(null);
    createMutation.mutate(data);
  };

  const isPending = isSubmitting || createMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {serverError && (
        <div className="p-4 rounded-md bg-[#ff6e14]/10 border border-[#ff6e14] text-xs font-mono text-[#ff6e14]">
          <p className="font-bold uppercase tracking-wider mb-1">Creation Error //</p>
          <p>{serverError}</p>
        </div>
      )}

      {/* Main card */}
      <div className="bg-[#201a18] border border-[#2a2420] rounded-lg p-6 sm:p-8 shadow-sm space-y-6">
        <h2
          className="text-2xl font-display uppercase tracking-tight text-[#e3e3db] border-b border-[#2a2420] pb-3"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Ticket Details //
        </h2>

        {/* Subject */}
        <div>
          <label
            htmlFor="subject"
            className="block text-xs font-mono uppercase tracking-wider text-[#8c7e77] mb-1.5"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Subject <span className="text-[#ff6e14]">*</span>
          </label>
          <input
            id="subject"
            type="text"
            placeholder="e.g. Cannot log in to customer dashboard"
            {...register("subject")}
            disabled={isPending}
            className={`w-full px-4 py-2.5 text-xs font-mono bg-[#1a1614] border rounded-md text-[#e3e3db] placeholder:text-[#8c7e77] focus:outline-hidden focus:border-[#ff6e14] focus:ring-1 focus:ring-[#ff6e14] transition-colors ${
              errors.subject ? "border-[#ff6e14]" : "border-[#352f2b]"
            }`}
            style={{ fontFamily: "var(--font-mono)" }}
          />
          {errors.subject && (
            <p className="mt-1.5 text-xs text-[#ff6e14] font-mono">
              {errors.subject.message}
            </p>
          )}
        </div>

        {/* Customer Info row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer Name */}
          <div>
            <label
              htmlFor="customer_name"
              className="block text-xs font-mono uppercase tracking-wider text-[#8c7e77] mb-1.5"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Customer Name
            </label>
            <input
              id="customer_name"
              type="text"
              placeholder="e.g. John Doe"
              {...register("customer_name")}
              disabled={isPending}
              className={`w-full px-4 py-2.5 text-xs font-mono bg-[#1a1614] border rounded-md text-[#e3e3db] placeholder:text-[#8c7e77] focus:outline-hidden focus:border-[#ff6e14] focus:ring-1 focus:ring-[#ff6e14] transition-colors ${
                errors.customer_name ? "border-[#ff6e14]" : "border-[#352f2b]"
              }`}
              style={{ fontFamily: "var(--font-mono)" }}
            />
            {errors.customer_name && (
              <p className="mt-1.5 text-xs text-[#ff6e14] font-mono">
                {errors.customer_name.message}
              </p>
            )}
          </div>

          {/* Customer Email */}
          <div>
            <label
              htmlFor="customer_email"
              className="block text-xs font-mono uppercase tracking-wider text-[#8c7e77] mb-1.5"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Customer Email
            </label>
            <input
              id="customer_email"
              type="email"
              placeholder="e.g. john@example.com"
              {...register("customer_email")}
              disabled={isPending}
              className={`w-full px-4 py-2.5 text-xs font-mono bg-[#1a1614] border rounded-md text-[#e3e3db] placeholder:text-[#8c7e77] focus:outline-hidden focus:border-[#ff6e14] focus:ring-1 focus:ring-[#ff6e14] transition-colors ${
                errors.customer_email ? "border-[#ff6e14]" : "border-[#352f2b]"
              }`}
              style={{ fontFamily: "var(--font-mono)" }}
            />
            {errors.customer_email && (
              <p className="mt-1.5 text-xs text-[#ff6e14] font-mono">
                {errors.customer_email.message}
              </p>
            )}
          </div>
        </div>
        <p className="text-[11px] text-[#8c7e77] font-mono -mt-2">
          NOTE: At least one identifier (Customer Name or Customer Email) is required.
        </p>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-xs font-mono uppercase tracking-wider text-[#8c7e77] mb-1.5"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            Description <span className="text-[#ff6e14]">*</span>
          </label>
          <textarea
            id="description"
            rows={5}
            placeholder="Detailed description of the issue or inquiry..."
            {...register("description")}
            disabled={isPending}
            className={`w-full p-4 text-xs font-mono bg-[#1a1614] border rounded-md text-[#e3e3db] placeholder:text-[#8c7e77] focus:outline-hidden focus:border-[#ff6e14] focus:ring-1 focus:ring-[#ff6e14] transition-colors ${
              errors.description ? "border-[#ff6e14]" : "border-[#352f2b]"
            }`}
            style={{ fontFamily: "var(--font-mono)" }}
          />
          {errors.description && (
            <p className="mt-1.5 text-xs text-[#ff6e14] font-mono">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Properties: Priority, Status, Assignee */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Priority */}
          <div>
            <label
              htmlFor="priority"
              className="block text-xs font-mono uppercase tracking-wider text-[#8c7e77] mb-1.5"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Priority
            </label>
            <select
              id="priority"
              {...register("priority")}
              disabled={isPending}
              className="w-full px-3 py-2.5 text-xs font-mono bg-[#1a1614] border border-[#352f2b] rounded-md text-[#e3e3db] focus:outline-hidden focus:border-[#ff6e14] cursor-pointer uppercase"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <option value="low" className="bg-[#1a1614]">Low</option>
              <option value="medium" className="bg-[#1a1614]">Medium</option>
              <option value="high" className="bg-[#1a1614]">High</option>
              <option value="urgent" className="bg-[#1a1614]">Urgent</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="status"
              className="block text-xs font-mono uppercase tracking-wider text-[#8c7e77] mb-1.5"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Initial Status
            </label>
            <select
              id="status"
              {...register("status")}
              disabled={isPending}
              className="w-full px-3 py-2.5 text-xs font-mono bg-[#1a1614] border border-[#352f2b] rounded-md text-[#e3e3db] focus:outline-hidden focus:border-[#ff6e14] cursor-pointer uppercase"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <option value="open" className="bg-[#1a1614]">Open</option>
              <option value="in_progress" className="bg-[#1a1614]">In Progress</option>
              <option value="waiting_on_customer" className="bg-[#1a1614]">Waiting</option>
              <option value="resolved" className="bg-[#1a1614]">Resolved</option>
            </select>
          </div>

          {/* Assignee */}
          <div>
            <label
              htmlFor="assignee_id"
              className="block text-xs font-mono uppercase tracking-wider text-[#8c7e77] mb-1.5"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Assignee
            </label>
            <select
              id="assignee_id"
              {...register("assignee_id")}
              disabled={isPending}
              className="w-full px-3 py-2.5 text-xs font-mono bg-[#1a1614] border border-[#352f2b] rounded-md text-[#e3e3db] focus:outline-hidden focus:border-[#ff6e14] cursor-pointer uppercase"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <option value="" className="bg-[#1a1614]">Unassigned</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id} className="bg-[#1a1614]">
                  {agent.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between pt-2">
        <Link
          href="/tickets"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-[#8c7e77] hover:text-[#e3e3db] transition-colors"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cancel</span>
        </Link>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff6e14] hover:bg-[#e3e3db] text-[#1a1614] text-xs font-mono font-bold tracking-widest uppercase rounded-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Create Ticket // 01</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
