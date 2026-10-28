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
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Support Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time queue metrics and overdue attention alerts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/tickets/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Ticket</span>
          </Link>
        </div>
      </div>

      {/* Error state */}
      {isStatsError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start justify-between gap-3 text-red-800 dark:text-red-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Failed to load dashboard metrics</p>
              <p className="text-xs text-red-600 dark:text-red-300 mt-0.5">
                {statsError instanceof Error ? statsError.message : "Internal API error"}
              </p>
            </div>
          </div>
          <button
            onClick={() => refetchStats()}
            className="px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/60 text-red-800 dark:text-red-200 text-xs font-semibold rounded-md transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Six Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Total */}
        <StatCard
          title="Total Tickets"
          subtitle="All tickets across lifecycle"
          count={stats?.total}
          href="/tickets"
          icon={Inbox}
          colorClass="text-indigo-600 dark:text-indigo-400"
          accentBgClass="bg-indigo-50 dark:bg-indigo-950/40"
          loading={isStatsLoading}
        />

        {/* Open */}
        <StatCard
          title="Open Tickets"
          subtitle="Status = Open"
          count={stats?.open}
          href="/tickets?status=open"
          icon={Activity}
          colorClass="text-blue-600 dark:text-blue-400"
          accentBgClass="bg-blue-50 dark:bg-blue-950/40"
          loading={isStatsLoading}
        />

        {/* In Progress */}
        <StatCard
          title="In Progress"
          subtitle="Active agent response"
          count={stats?.in_progress}
          href="/tickets?status=in_progress"
          icon={Clock}
          colorClass="text-amber-600 dark:text-amber-400"
          accentBgClass="bg-amber-50 dark:bg-amber-950/40"
          loading={isStatsLoading}
        />

        {/* Resolved */}
        <StatCard
          title="Resolved"
          subtitle="Completed tickets"
          count={stats?.resolved}
          href="/tickets?status=resolved"
          icon={CheckCircle2}
          colorClass="text-emerald-600 dark:text-emerald-400"
          accentBgClass="bg-emerald-50 dark:bg-emerald-950/40"
          loading={isStatsLoading}
        />

        {/* Urgent */}
        <StatCard
          title="Urgent Tickets"
          subtitle="Unresolved urgent attention"
          count={stats?.urgent}
          href="/tickets?priority=urgent&status=open&status=in_progress&status=waiting_on_customer"
          icon={Flame}
          colorClass="text-rose-600 dark:text-rose-400"
          accentBgClass="bg-rose-50 dark:bg-rose-950/40"
          loading={isStatsLoading}
        />

        {/* Overdue */}
        <StatCard
          title="Overdue (>24h)"
          subtitle="Unresolved > 24h SLA"
          count={stats?.overdue}
          href="/tickets?overdue=true"
          icon={AlertCircle}
          colorClass="text-red-600 dark:text-red-400"
          accentBgClass="bg-red-100 dark:bg-red-950/60"
          loading={isStatsLoading}
        />
      </div>

      {/* Overdue Tickets Table Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Overdue Tickets Requiring Attention
            </h2>
            {stats && stats.overdue > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs font-semibold">
                {stats.overdue}
              </span>
            )}
          </div>

          <Link
            href="/tickets?overdue=true"
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
          >
            <span>View all overdue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isOverdueLoading ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-slate-400 text-sm animate-pulse">
            Loading overdue tickets...
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-slate-500 text-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              No overdue tickets!
            </p>
            <p className="text-xs text-slate-400 mt-1">
              All active tickets have been responded to within the 24-hour SLA.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
