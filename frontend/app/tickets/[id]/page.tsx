"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Mail,
  User,
  AlertCircle,
  FileText,
  MessageSquare,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { PriorityBadge } from "@/components/badges/PriorityBadge";
import { OverdueBadge } from "@/components/badges/OverdueBadge";
import { PropertiesPanel } from "@/components/PropertiesPanel";
import { MessageThread } from "@/components/MessageThread";
import { Composer } from "@/components/Composer";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { formatRelativeTime, formatExactTime } from "@/lib/date";

function TicketDetailContent() {
  const params = useParams();
  const idStr = Array.isArray(params.id) ? params.id[0] : params.id;
  const ticketId = parseInt(idStr as string, 10);

  // 1. Fetch ticket details
  const {
    data: ticket,
    isLoading: isTicketLoading,
    isError: isTicketError,
    error: ticketError,
  } = useQuery({
    queryKey: QUERY_KEYS.ticket(ticketId),
    queryFn: () => api.getTicket(ticketId),
    enabled: !isNaN(ticketId),
  });

  // 2. Fetch messages
  const {
    data: messages = [],
    isLoading: isMessagesLoading,
  } = useQuery({
    queryKey: QUERY_KEYS.messages(ticketId),
    queryFn: () => api.getTicketMessages(ticketId),
    enabled: !isNaN(ticketId) && !isTicketError,
  });

  // 3. Fetch audit events
  const {
    data: events = [],
    isLoading: isEventsLoading,
  } = useQuery({
    queryKey: QUERY_KEYS.events(ticketId),
    queryFn: () => api.getTicketEvents(ticketId),
    enabled: !isNaN(ticketId) && !isTicketError,
  });

  // Handle 404 state as specified: "404 page 'Ticket #99 not found'"
  if (
    isTicketError &&
    (ticketError instanceof ApiError &&
      (ticketError.status === 404 || ticketError.code === "ticket_not_found"))
  ) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
          Ticket #{idStr} not found
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
          The requested ticket does not exist or may have been removed. Please check the ticket number and try again.
        </p>
        <Link
          href="/tickets"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to tickets</span>
        </Link>
      </div>
    );
  }

  // Generic loading skeleton
  if (isTicketLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-10 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
          <div className="space-y-6">
            <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Unexpected error
  if (!ticket || isTicketError) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="p-6 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-200 text-center">
          <p className="font-semibold text-base mb-1">Failed to load ticket #{idStr}</p>
          <p className="text-sm mb-4">
            {ticketError instanceof Error ? ticketError.message : "Internal error"}
          </p>
          <Link
            href="/tickets"
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to ticket list</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top back navigation & ID */}
      <div className="flex items-center justify-between">
        <Link
          href="/tickets"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to tickets</span>
        </Link>
        <span className="font-mono text-xs font-bold text-slate-400">
          Ticket ID: #{ticket.id}
        </span>
      </div>

      {/* Main Grid: Left (2/3) + Right (1/3) on >= 1024px, collapses below 1024px */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2/3): Header, Description, Message Thread, Composer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                #{ticket.id}
              </span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              {ticket.is_overdue && (
                <OverdueBadge ageHours={ticket.age_hours} />
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-snug">
              {ticket.subject}
            </h1>

            {/* Customer & Timestamp row */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {ticket.customer_name || "Anonymous Customer"}
                </span>
                {ticket.customer_email && (
                  <span className="text-slate-400">({ticket.customer_email})</span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Created:</span>
                <span
                  title={formatExactTime(ticket.created_at)}
                  className="font-medium text-slate-700 dark:text-slate-300 cursor-help"
                >
                  {formatRelativeTime(ticket.created_at)}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Last updated:</span>
                <span
                  title={formatExactTime(ticket.updated_at)}
                  className="font-medium text-slate-700 dark:text-slate-300 cursor-help"
                >
                  {formatRelativeTime(ticket.updated_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Description</span>
            </h2>
            <div className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </div>
          </div>

          {/* Conversation Thread */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Conversation & Notes ({messages.length})</span>
              </h2>
            </div>
            <MessageThread messages={messages} isLoading={isMessagesLoading} />
          </div>

          {/* Composer */}
          <div className="space-y-2">
            <Composer ticketId={ticket.id} />
          </div>
        </div>

        {/* Right Column (1/3): Properties Panel & Activity Timeline */}
        <div className="space-y-6">
          <PropertiesPanel ticket={ticket} />
          <ActivityTimeline events={events} isLoading={isEventsLoading} />
        </div>
      </div>
    </div>
  );
}

export default function TicketDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-10 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
          </div>
        </div>
      }
    >
      <TicketDetailContent />
    </Suspense>
  );
}
