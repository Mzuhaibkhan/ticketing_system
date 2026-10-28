"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Plus, AlertTriangle, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import { TicketFilters, TicketPriority, TicketStatus } from "@/lib/types";
import { TicketFilters as FilterBar } from "@/components/TicketFilters";
import { TicketTable } from "@/components/TicketTable";
import { EmptyState } from "@/components/EmptyState";

function TicketsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse filters from URL
  const q = searchParams.get("q") || undefined;
  const status = searchParams.getAll("status") as TicketStatus[];
  const priority = searchParams.getAll("priority") as TicketPriority[];
  const assignee_id = searchParams.get("assignee_id") || undefined;
  const overdueParam = searchParams.get("overdue");
  const overdue = overdueParam === "true" ? true : undefined;
  const sort = (searchParams.get("sort") as "updated" | "priority") || "updated";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = 20;

  const filters: TicketFilters = {
    q,
    status: status.length > 0 ? status : undefined,
    priority: priority.length > 0 ? priority : undefined,
    assignee_id,
    overdue,
    sort,
    page,
    page_size: pageSize,
  };

  const hasActiveFilters =
    Boolean(q) ||
    status.length > 0 ||
    priority.length > 0 ||
    Boolean(assignee_id) ||
    overdue === true ||
    sort !== "updated";

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: QUERY_KEYS.tickets(filters as unknown as Record<string, unknown>),
    queryFn: () => api.getTickets(filters),
  });

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/tickets?${params.toString()}`, { scroll: false });
  };

  const handleClearFilters = () => {
    router.push("/tickets", { scroll: false });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Tickets
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage, triage, and respond to incoming customer support tickets
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isFetching && !isLoading && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mr-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
              <span>Updating...</span>
            </div>
          )}
          <Link
            href="/tickets/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Ticket</span>
          </Link>
        </div>
      </div>

      {/* Filter toolbar */}
      <FilterBar />

      {/* Error state */}
      {isError && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start justify-between gap-3 text-red-800 dark:text-red-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">Failed to load tickets</p>
              <p className="text-xs text-red-600 dark:text-red-300 mt-0.5">
                {error instanceof Error ? error.message : "An unexpected server error occurred"}
              </p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/60 dark:hover:bg-red-900 text-red-800 dark:text-red-200 text-xs font-semibold rounded-md transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table & Empty states */}
      {!isError && (
        <>
          {isLoading ? (
            <TicketTable
              tickets={[]}
              total={0}
              page={page}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              isLoading={true}
            />
          ) : data && data.items.length > 0 ? (
            <TicketTable
              tickets={data.items}
              total={data.total}
              page={page}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              isLoading={false}
            />
          ) : (
            <EmptyState
              type={hasActiveFilters ? "no-matches" : "no-tickets"}
              onClearFilters={handleClearFilters}
            />
          )}
        </>
      )}
    </div>
  );
}

export default function TicketsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-8 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      }
    >
      <TicketsContent />
    </Suspense>
  );
}

