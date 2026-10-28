import React from "react";
import Link from "next/link";
import { Inbox, FilterX, Plus } from "lucide-react";

interface EmptyStateProps {
  type: "no-tickets" | "no-matches";
  onClearFilters?: () => void;
}

export function EmptyState({ type, onClearFilters }: EmptyStateProps) {
  if (type === "no-tickets") {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-[#201a18] rounded-lg border border-dashed border-[#352f2b] my-4">
        <div className="w-12 h-12 rounded-full bg-[#1a1614] border border-[#ff6e14] text-[#ff6e14] flex items-center justify-center mb-4">
          <Inbox className="w-6 h-6" />
        </div>
        <h3
          className="text-3xl font-display uppercase tracking-tight text-[#e3e3db] mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          No tickets yet — queue is clear
        </h3>
        <p className="text-sm text-[#8c7e77] max-w-sm mb-6 font-mono">
          Your support inbox is clear. Create your first support ticket to track inquiries and customer requests.
        </p>
        <Link
          href="/tickets/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#ff6e14] hover:bg-[#e3e3db] text-[#1a1614] text-xs font-mono font-bold tracking-widest uppercase rounded-sm transition-colors"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <Plus className="w-4 h-4" />
          <span>New Ticket // 01</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-[#201a18] rounded-lg border border-dashed border-[#352f2b] my-4">
      <div className="w-12 h-12 rounded-full bg-[#1a1614] border border-[#8c7e77] text-[#8c7e77] flex items-center justify-center mb-4">
        <FilterX className="w-6 h-6" />
      </div>
      <h3
        className="text-3xl font-display uppercase tracking-tight text-[#e3e3db] mb-2"
        style={{ fontFamily: "var(--font-display)" }}
      >
        No tickets match these filters
      </h3>
      <p className="text-sm text-[#8c7e77] max-w-sm mb-6 font-mono">
        Try broadening your search term or resetting applied status, priority, or assignee filters.
      </p>
      {onClearFilters && (
        <button
          onClick={onClearFilters}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2a2420] hover:bg-[#352f2b] text-[#e3e3db] text-xs font-mono font-bold tracking-widest uppercase rounded-sm transition-colors cursor-pointer"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <span>Clear all filters</span>
        </button>
      )}
    </div>
  );
}
