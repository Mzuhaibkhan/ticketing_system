"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  Clock,
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

  // Handle 404 state
  if (
    isTicketError &&
    (ticketError instanceof ApiError &&
      (ticketError.status === 404 || ticketError.code === "ticket_not_found"))
  ) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-[#201a18] rounded-lg border border-[#2a2420]">
        <div className="w-14 h-14 rounded-full bg-[#1a1614] border border-[#ff6e14] text-[#ff6e14] flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1
          className="text-4xl font-display uppercase tracking-tight text-[#e3e3db] mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Ticket #{idStr} not found // 404
        </h1>
        <p
          className="text-xs font-mono text-[#8c7e77] max-w-md mb-6"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          The requested ticket does not exist or may have been deleted. Verify the ticket number and return to queue.
        </p>
        <Link
          href="/tickets"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff6e14] hover:bg-[#e3e3db] text-[#1a1614] text-xs font-mono font-bold tracking-widest uppercase rounded-sm shadow-sm transition-colors"
          style={{ fontFamily: "var(--font-mono)" }}
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
      <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-[#251f1c] rounded" />
        <div className="h-14 w-3/4 bg-[#201a18] rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-40 bg-[#201a18] rounded-lg" />
            <div className="h-64 bg-[#201a18] rounded-lg" />
          </div>
          <div className="space-y-6">
            <div className="h-48 bg-[#201a18] rounded-lg" />
            <div className="h-64 bg-[#201a18] rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // Unexpected error
  if (!ticket || isTicketError) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="p-6 rounded-lg bg-[#ff6e14]/10 border border-[#ff6e14] text-[#ff6e14] font-mono text-xs text-center">
          <p className="font-bold text-sm uppercase mb-1">Failed to load ticket #{idStr}</p>
          <p className="mb-4 text-[#8c7e77]">
            {ticketError instanceof Error ? ticketError.message : "Internal error"}
          </p>
          <Link
            href="/tickets"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#ff6e14] text-[#1a1614] text-xs font-bold uppercase tracking-wider rounded-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to ticket queue</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top back navigation & ID */}
      <div
        className="flex items-center justify-between text-xs font-mono text-[#8c7e77] uppercase tracking-wider"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <Link
          href="/tickets"
          className="inline-flex items-center gap-1.5 hover:text-[#ff6e14] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to queue</span>
        </Link>
        <span className="font-bold text-[#ff6e14]">
          ID // #{ticket.id}
        </span>
      </div>

      {/* Main Grid: Left (2/3) + Right (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2/3): Header, Description, Message Thread, Composer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="bg-[#201a18] border border-[#2a2420] rounded-lg p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="font-mono text-xs font-bold px-2 py-0.5 rounded-sm bg-[#1a1614] border border-[#ff6e14] text-[#ff6e14]"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                #{ticket.id}
              </span>
              <StatusBadge status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              {ticket.is_overdue && (
                <OverdueBadge ageHours={ticket.age_hours} />
              )}
            </div>

            <h1
              className="text-3xl sm:text-4xl font-display uppercase tracking-tight text-[#e3e3db] leading-snug"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {ticket.subject}
            </h1>

            {/* Customer & Timestamp row */}
            <div
              className="pt-4 border-t border-[#2a2420] flex flex-wrap items-center gap-y-2 gap-x-6 text-xs font-mono text-[#8c7e77]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#ff6e14]" />
                <span className="font-bold text-[#e3e3db]">
                  {ticket.customer_name || "Anonymous"}
                </span>
                {ticket.customer_email && (
                  <span className="text-[#8c7e77]">[{ticket.customer_email}]</span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>CREATED:</span>
                <span
                  title={formatExactTime(ticket.created_at)}
                  className="text-[#e3e3db] cursor-help hover:text-[#ff6e14]"
                >
                  {formatRelativeTime(ticket.created_at)}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>UPDATED:</span>
                <span
                  title={formatExactTime(ticket.updated_at)}
                  className="text-[#e3e3db] cursor-help hover:text-[#ff6e14]"
                >
                  {formatRelativeTime(ticket.updated_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-[#201a18] border border-[#2a2420] rounded-lg p-6 shadow-sm space-y-2">
            <h2
              className="text-xs font-mono font-bold uppercase tracking-widest text-[#8c7e77] flex items-center gap-1.5"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <FileText className="w-3.5 h-3.5 text-[#ff6e14]" />
              <span>DESCRIPTION //</span>
            </h2>
            <div className="text-xs font-mono text-[#e3e3db] whitespace-pre-wrap leading-relaxed pt-1">
              {ticket.description}
            </div>
          </div>

          {/* Conversation Thread */}
          <div className="space-y-3">
            <h2
              className="text-xs font-mono font-bold uppercase tracking-widest text-[#8c7e77] flex items-center gap-1.5"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#ff6e14]" />
              <span>CONVERSATION & NOTES ({messages.length}) //</span>
            </h2>
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
        <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-6 w-32 bg-[#251f1c] rounded" />
          <div className="h-14 w-3/4 bg-[#201a18] rounded-lg" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-40 bg-[#201a18] rounded-lg" />
              <div className="h-64 bg-[#201a18] rounded-lg" />
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-[#201a18] rounded-lg" />
              <div className="h-64 bg-[#201a18] rounded-lg" />
            </div>
          </div>
        </div>
      }
    >
      <TicketDetailContent />
    </Suspense>
  );
}
