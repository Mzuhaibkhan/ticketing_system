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
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-[#2a2420] pb-6">
        <div>
          <div
            className="text-xs font-mono text-[#8c7e77] uppercase tracking-widest mb-2"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            SYSTEM // 02 — QUEUE
          </div>
          <h1
            className="text-5xl sm:text-7xl font-display uppercase tracking-tight text-[#e3e3db] leading-none"
            style={{ fontFamily: "var(--font-display)" }}
          >
            TICKETS QUEUE
          </h1>
          <p
            className="text-xs font-mono text-[#8c7e77] mt-2 uppercase tracking-wider"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            TRIAGE, MANAGE, AND RESOLVE INCOMING INQUIRIES
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isFetching && !isLoading && (
            <div
              className="flex items-center gap-1.5 text-xs font-mono text-[#8c7e77] mr-2"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#ff6e14]" />
              <span>SYNCING...</span>
            </div>
          )}
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

      {/* Filter toolbar */}
      <FilterBar />

      {/* Error state */}
      {isError && (
        <div className="p-4 rounded-md bg-[#ff6e14]/10 border border-[#ff6e14] flex items-start justify-between gap-3 text-[#ff6e14] font-mono text-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold uppercase tracking-wider">FAILED TO LOAD TICKETS</p>
              <p className="text-[#8c7e77] mt-0.5">
                {error instanceof Error ? error.message : "An unexpected server error occurred"}
              </p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="px-3 py-1.5 bg-[#ff6e14] text-[#1a1614] text-xs font-bold uppercase rounded-sm transition-colors cursor-pointer"
          >
            RETRY
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
        <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
          <div className="h-12 w-48 bg-[#251f1c] rounded" />
          <div className="h-28 bg-[#201a18] rounded-lg" />
          <div className="h-64 bg-[#201a18] rounded-lg" />
        </div>
      }
    >
      <TicketsContent />
    </Suspense>
  );
}
