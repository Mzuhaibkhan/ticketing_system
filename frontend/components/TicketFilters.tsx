"use client";

import React, { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, RotateCcw } from "lucide-react";
import { TicketPriority, TicketStatus } from "@/lib/types";
import { useActingAgent } from "@/context/acting-agent-context";

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting_on_customer", label: "Waiting" },
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
  const [prevQ, setPrevQ] = useState(currentQ);
  if (prevQ !== currentQ) {
    setPrevQ(currentQ);
    setSearchTerm(currentQ);
  }

  const updateFilter = useCallback(
    (key: string, value: string | string[] | boolean | null) => {
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
    },
    [searchParams, router, startTransition]
  );

  // Sync search input after 300ms debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== currentQ) {
        updateFilter("q", searchTerm.trim() ? searchTerm.trim() : null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, currentQ, updateFilter]);

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
    <div className="bg-[#201a18] border border-[#2a2420] rounded-lg p-5 shadow-sm space-y-4 mb-6">
      {/* Top row: Search, Assignee, Sort, Overdue toggle, Clear */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search input with 300ms debounce */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8c7e77]" />
          <input
            type="text"
            placeholder="Search tickets by subject or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 text-xs font-mono bg-[#1a1614] border border-[#352f2b] rounded-md text-[#e3e3db] placeholder:text-[#8c7e77] focus:outline-hidden focus:border-[#ff6e14] focus:ring-1 focus:ring-[#ff6e14] transition-colors"
            style={{ fontFamily: "var(--font-mono)" }}
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                updateFilter("q", null);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c7e77] hover:text-[#ff6e14]"
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
            className="text-xs font-mono bg-[#1a1614] border border-[#352f2b] rounded-md px-3 py-2.5 text-[#e3e3db] focus:outline-hidden focus:border-[#ff6e14] cursor-pointer uppercase"
            style={{ fontFamily: "var(--font-mono)" }}
            aria-label="Filter by assignee"
          >
            <option value="" className="bg-[#1a1614]">ALL ASSIGNEES</option>
            <option value="unassigned" className="bg-[#1a1614]">UNASSIGNED</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id} className="bg-[#1a1614]">
                {agent.name.toUpperCase()}
              </option>
            ))}
          </select>

          {/* Sort select */}
          <select
            value={currentSort}
            onChange={(e) => updateFilter("sort", e.target.value)}
            className="text-xs font-mono bg-[#1a1614] border border-[#352f2b] rounded-md px-3 py-2.5 text-[#e3e3db] focus:outline-hidden focus:border-[#ff6e14] cursor-pointer uppercase"
            style={{ fontFamily: "var(--font-mono)" }}
            aria-label="Sort tickets"
          >
            <option value="updated" className="bg-[#1a1614]">RECENTLY UPDATED</option>
            <option value="priority" className="bg-[#1a1614]">PRIORITY (URGENT → LOW)</option>
          </select>

          {/* Overdue toggle */}
          <button
            type="button"
            onClick={() => updateFilter("overdue", !currentOverdue)}
            className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded-md text-xs font-mono font-bold tracking-wider uppercase border transition-colors cursor-pointer ${
              currentOverdue
                ? "bg-[#ff6e14] text-[#1a1614] border-[#ff6e14] shadow-xs"
                : "bg-[#1a1614] text-[#8c7e77] border-[#352f2b] hover:border-[#ff6e14] hover:text-[#e3e3db]"
            }`}
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <span>OVERDUE ONLY</span>
          </button>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 px-3 py-2.5 text-xs font-mono text-[#8c7e77] hover:text-[#ff6e14] hover:bg-[#251f1c] rounded-md transition-colors cursor-pointer uppercase"
              style={{ fontFamily: "var(--font-mono)" }}
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>CLEAR</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom row: Multi-select Status & Priority chips */}
      <div className="pt-3 border-t border-[#2a2420] flex flex-wrap items-center gap-y-2 gap-x-6 text-xs">
        {/* Status multi-select */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="font-mono text-[#8c7e77] uppercase text-[11px] tracking-wider"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            STATUS //
          </span>
          {STATUS_OPTIONS.map((st) => {
            const isSelected = currentStatuses.includes(st.value);
            return (
              <button
                key={st.value}
                type="button"
                onClick={() => toggleStatus(st.value)}
                className={`px-3 py-1 rounded-sm text-xs font-mono uppercase tracking-wider border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#ff6e14] border-[#ff6e14] text-[#1a1614] font-bold shadow-xs"
                    : "bg-[#1a1614] border-[#352f2b] text-[#8c7e77] hover:border-[#ff6e14] hover:text-[#e3e3db]"
                }`}
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {st.label}
              </button>
            );
          })}
        </div>

        {/* Priority multi-select */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="font-mono text-[#8c7e77] uppercase text-[11px] tracking-wider"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            PRIORITY //
          </span>
          {PRIORITY_OPTIONS.map((pr) => {
            const isSelected = currentPriorities.includes(pr.value);
            return (
              <button
                key={pr.value}
                type="button"
                onClick={() => togglePriority(pr.value)}
                className={`px-3 py-1 rounded-sm text-xs font-mono uppercase tracking-wider border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#ff6e14] border-[#ff6e14] text-[#1a1614] font-bold shadow-xs"
                    : "bg-[#1a1614] border-[#352f2b] text-[#8c7e77] hover:border-[#ff6e14] hover:text-[#e3e3db]"
                }`}
                style={{ fontFamily: "var(--font-mono)" }}
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
