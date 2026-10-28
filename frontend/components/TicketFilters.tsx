"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, RotateCcw } from "lucide-react";
import { TicketPriority, TicketStatus } from "@/lib/types";
import { useActingAgent } from "@/context/acting-agent-context";

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting_on_customer", label: "Waiting on Customer" },
  { value: "resolved", label: "Resolved" },
];

const PRIORITY_OPTIONS: { value: TicketPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export function TicketFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const { agents } = useActingAgent();

  // Parse existing filters from URL
  const currentQ = searchParams.get("q") || "";
  const currentStatuses = searchParams.getAll("status") as TicketStatus[];
  const currentPriorities = searchParams.getAll("priority") as TicketPriority[];
  const currentAssignee = searchParams.get("assignee_id") || "";
  const currentOverdue = searchParams.get("overdue") === "true";
  const currentSort = searchParams.get("sort") || "updated";

  // Local state for 300ms search debounce
  const [searchTerm, setSearchTerm] = useState(currentQ);

  useEffect(() => {
    setSearchTerm(currentQ);
  }, [currentQ]);

  // Sync search input after 300ms debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== currentQ) {
        updateFilter("q", searchTerm.trim() ? searchTerm.trim() : null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, currentQ]);

  const updateFilter = (
    key: string,
    value: string | string[] | boolean | null
  ) => {
    const params = new URLSearchParams(searchParams.toString());

    // Reset pagination to page 1 on filter modification
    params.delete("page");

    if (value === null || value === "" || value === false || (Array.isArray(value) && value.length === 0)) {
      params.delete(key);
    } else if (Array.isArray(value)) {
      params.delete(key);
      value.forEach((v) => params.append(key, v));
    } else {
      params.set(key, String(value));
    }

    startTransition(() => {
      router.push(`/tickets?${params.toString()}`, { scroll: false });
    });
  };

  const toggleStatus = (st: TicketStatus) => {
    const next = currentStatuses.includes(st)
      ? currentStatuses.filter((s) => s !== st)
      : [...currentStatuses, st];
    updateFilter("status", next);
  };

  const togglePriority = (pr: TicketPriority) => {
    const next = currentPriorities.includes(pr)
      ? currentPriorities.filter((p) => p !== pr)
      : [...currentPriorities, pr];
    updateFilter("priority", next);
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    startTransition(() => {
      router.push("/tickets", { scroll: false });
    });
  };

  const hasActiveFilters =
    Boolean(currentQ) ||
    currentStatuses.length > 0 ||
    currentPriorities.length > 0 ||
    Boolean(currentAssignee) ||
    currentOverdue ||
    currentSort !== "updated";

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-3.5 mb-6">
      {/* Top row: Search, Assignee, Sort, Overdue toggle, Clear */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search input with 300ms debounce */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tickets by subject or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                updateFilter("q", null);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Right filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Assignee select */}
          <select
            value={currentAssignee}
            onChange={(e) => updateFilter("assignee_id", e.target.value || null)}
            className="text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            aria-label="Filter by assignee"
          >
            <option value="">All Assignees</option>
            <option value="unassigned">Unassigned</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>

          {/* Sort select */}
          <select
            value={currentSort}
            onChange={(e) => updateFilter("sort", e.target.value)}
            className="text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            aria-label="Sort tickets"
          >
            <option value="updated">Recently updated</option>
            <option value="priority">Priority (Urgent → Low)</option>
          </select>

          {/* Overdue toggle */}
          <button
            type="button"
            onClick={() => updateFilter("overdue", !currentOverdue)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium border transition-colors cursor-pointer ${
              currentOverdue
                ? "bg-red-500 text-white border-red-500 shadow-xs"
                : "bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <span>Overdue only</span>
          </button>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 px-2.5 py-2 text-xs sm:text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom row: Multi-select Status & Priority chips */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs">
        {/* Status multi-select */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] mr-1">
            Status:
          </span>
          {STATUS_OPTIONS.map((st) => {
            const isSelected = currentStatuses.includes(st.value);
            return (
              <button
                key={st.value}
                type="button"
                onClick={() => toggleStatus(st.value)}
                className={`px-2.5 py-1 rounded-md font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-700 dark:text-indigo-300 shadow-2xs"
                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {st.label}
              </button>
            );
          })}
        </div>

        {/* Priority multi-select */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] mr-1">
            Priority:
          </span>
          {PRIORITY_OPTIONS.map((pr) => {
            const isSelected = currentPriorities.includes(pr.value);
            return (
              <button
                key={pr.value}
                type="button"
                onClick={() => togglePriority(pr.value)}
                className={`px-2.5 py-1 rounded-md font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-700 dark:text-indigo-300 shadow-2xs"
                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                {pr.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

