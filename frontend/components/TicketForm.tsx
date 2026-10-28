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
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });

      toast.success(`Ticket #${newTicket.id} created successfully!`);
      router.push(`/tickets/${newTicket.id}`);
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        setServerError(err.message);

        // Map server validation details onto specific form fields
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
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-sm text-red-700 dark:text-red-300">
          <p className="font-semibold">Creation Error</p>
          <p>{serverError}</p>
        </div>
      )}

      {/* Main card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
          Ticket Details
        </h2>

        {/* Subject */}
        <div>
          <label
            htmlFor="subject"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5"
          >
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            id="subject"
            type="text"
            placeholder="e.g. Cannot log in to customer dashboard"
            {...register("subject")}
            disabled={isPending}
            className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-colors ${
              errors.subject
                ? "border-red-500 focus:ring-red-500"
                : "border-slate-300 dark:border-slate-700"
            }`}
          />
          {errors.subject && (
            <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
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
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5"
            >
              Customer Name
            </label>
            <input
              id="customer_name"
              type="text"
              placeholder="e.g. John Doe"
              {...register("customer_name")}
              disabled={isPending}
              className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-colors ${
                errors.customer_name
                  ? "border-red-500 focus:ring-red-500"
                  : "border-slate-300 dark:border-slate-700"
              }`}
            />
            {errors.customer_name && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
                {errors.customer_name.message}
              </p>
            )}
          </div>

          {/* Customer Email */}
          <div>
            <label
              htmlFor="customer_email"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5"
            >
              Customer Email
            </label>
            <input
              id="customer_email"
              type="email"
              placeholder="e.g. john@example.com"
              {...register("customer_email")}
              disabled={isPending}
              className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-colors ${
                errors.customer_email
                  ? "border-red-500 focus:ring-red-500"
                  : "border-slate-300 dark:border-slate-700"
              }`}
            />
            {errors.customer_email && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
                {errors.customer_email.message}
              </p>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
          Note: At least one identifier (Customer Name or Customer Email) is required.
        </p>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5"
          >
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            rows={5}
            placeholder="Detailed description of the issue or inquiry..."
            {...register("description")}
            disabled={isPending}
            className={`w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-colors ${
              errors.description
                ? "border-red-500 focus:ring-red-500"
                : "border-slate-300 dark:border-slate-700"
            }`}
          />
          {errors.description && (
            <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
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
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5"
            >
              Priority
            </label>
            <select
              id="priority"
              {...register("priority")}
              disabled={isPending}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="status"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5"
            >
              Initial Status
            </label>
            <select
              id="status"
              {...register("status")}
              disabled={isPending}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_on_customer">Waiting on Customer</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Assignee */}
          <div>
            <label
              htmlFor="assignee_id"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5"
            >
              Assignee
            </label>
            <select
              id="assignee_id"
              {...register("assignee_id")}
              disabled={isPending}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">Unassigned</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
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
          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cancel</span>
        </Link>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating ticket...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Create Ticket</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

