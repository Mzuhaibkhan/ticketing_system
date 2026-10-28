"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Inbox,
  AlertCircle,
  Clock,
  CheckCircle2,
  Flame,
  Activity,
  ArrowRight,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { api } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import { StatCard } from "@/components/StatCard";
import { TicketTable } from "@/components/TicketTable";

export default function DashboardPage() {
  // 1. Dashboard aggregate statistics query
  const {
    data: stats,
    isLoading: isStatsLoading,
    isError: isStatsError,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: QUERY_KEYS.dashboard,
    queryFn: () => api.getDashboardStats(),
  });

  // 2. Fetch small overdue tickets table for immediate visibility
  const {
    data: overdueTickets,
    isLoading: isOverdueLoading,
  } = useQuery({
    queryKey: QUERY_KEYS.tickets({ overdue: true, page_size: 5 }),
    queryFn: () => api.getTickets({ overdue: true, page_size: 5 }),
  });

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-[#2a2420] pb-6">
        <div>
          <div
            className="text-xs font-mono text-[#8c7e77] uppercase tracking-widest mb-2"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            SYSTEM // 01 — OVERVIEW
          </div>
          <h1
            className="text-5xl sm:text-7xl font-display uppercase tracking-tight text-[#e3e3db] leading-none"
            style={{ fontFamily: "var(--font-display)" }}
          >
            SUPPORT DASHBOARD
          </h1>
          <p
            className="text-xs font-mono text-[#8c7e77] mt-2 uppercase tracking-wider"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            REAL-TIME QUEUE METRICS // SLA OVERDUE MONITORING
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/tickets/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff6e14] hover:bg-[#e3e3db] text-[#1a1614] text-xs font-mono font-bold tracking-widest uppercase rounded-sm shadow-xs transition-colors"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <Plus className="w-4 h-4" />
            <span>NEW TICKET</span>
          </Link>
        </div>
      </div>

      {/* Error state */}
      {isStatsError && (
        <div className="p-4 rounded-md bg-[#ff6e14]/10 border border-[#ff6e14] flex items-start justify-between gap-3 text-[#ff6e14] font-mono text-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold uppercase tracking-wider">FAILED TO LOAD METRICS</p>
              <p className="text-[#8c7e77] mt-0.5">
                {statsError instanceof Error ? statsError.message : "Internal API error"}
              </p>
            </div>
          </div>
          <button
            onClick={() => refetchStats()}
            className="px-3 py-1.5 bg-[#ff6e14] text-[#1a1614] text-xs font-bold uppercase rounded-sm transition-colors cursor-pointer"
          >
            RETRY
          </button>
        </div>
      )}

      {/* Six Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Total */}
        <StatCard
          title="Total Tickets"
          subtitle="ALL TICKETS ACROSS LIFECYCLE"
          count={stats?.total}
          href="/tickets"
          icon={Inbox}
          loading={isStatsLoading}
        />

        {/* Open */}
        <StatCard
          title="Open Tickets"
          subtitle="STATUS = OPEN"
          count={stats?.open}
          href="/tickets?status=open"
          icon={Activity}
          loading={isStatsLoading}
        />

        {/* In Progress */}
        <StatCard
          title="In Progress"
          subtitle="ACTIVE AGENT TRIAGE"
          count={stats?.in_progress}
          href="/tickets?status=in_progress"
          icon={Clock}
          loading={isStatsLoading}
        />

        {/* Resolved */}
        <StatCard
          title="Resolved"
          subtitle="COMPLETED TICKETS"
          count={stats?.resolved}
          href="/tickets?status=resolved"
          icon={CheckCircle2}
          loading={isStatsLoading}
        />

        {/* Urgent */}
        <StatCard
          title="Urgent Tickets"
          subtitle="UNRESOLVED URGENT QUEUE"
          count={stats?.urgent}
          href="/tickets?priority=urgent&status=open&status=in_progress&status=waiting_on_customer"
          icon={Flame}
          loading={isStatsLoading}
        />

        {/* Overdue */}
        <StatCard
          title="Overdue (>24h)"
          subtitle="STRICTLY > 24H RESPONSE SLA"
          count={stats?.overdue}
          href="/tickets?overdue=true"
          icon={AlertCircle}
          loading={isStatsLoading}
        />
      </div>

      {/* Overdue Tickets Table Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-[#2a2420] pb-3">
          <div className="flex items-center gap-3">
            <h2
              className="text-2xl font-display uppercase tracking-tight text-[#e3e3db]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              OVERDUE TICKETS REQUIRING ATTENTION //
            </h2>
            {stats && stats.overdue > 0 && (
              <span
                className="px-2.5 py-0.5 rounded-sm bg-[#ff6e14] text-[#1a1614] text-xs font-mono font-bold"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {stats.overdue} BREACHED
              </span>
            )}
          </div>

          <Link
            href="/tickets?overdue=true"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold tracking-wider text-[#ff6e14] hover:text-[#e3e3db] transition-colors uppercase"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <span>VIEW ALL OVERDUE</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isOverdueLoading ? (
          <div className="bg-[#201a18] border border-[#2a2420] rounded-lg p-8 text-center text-[#8c7e77] text-xs font-mono animate-pulse">
            LOADING OVERDUE TICKETS...
          </div>
        ) : overdueTickets && overdueTickets.items.length > 0 ? (
          <TicketTable
            tickets={overdueTickets.items}
            total={overdueTickets.total}
            page={1}
            pageSize={5}
            onPageChange={() => {}}
            isLoading={false}
          />
        ) : (
          <div className="bg-[#201a18] border border-[#2a2420] rounded-lg p-8 text-center text-[#8c7e77] text-xs font-mono">
            <CheckCircle2 className="w-8 h-8 text-[#ff6e14] mx-auto mb-2" />
            <p className="font-bold text-[#e3e3db] uppercase tracking-wider">
              NO OVERDUE TICKETS // ALL SLAS IN COMPLIANCE
            </p>
            <p className="text-[#8c7e77] text-[11px] mt-1">
              All active tickets have been responded to within the 24-hour response window.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
