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
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 my-4">
        <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
          <Inbox className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
          No tickets yet — create one
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-5">
          Your support inbox is clear! Create your first support ticket to track inquiries and customer requests.
        </p>
        <Link
          href="/tickets/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Ticket</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 my-4">
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mb-4">
        <FilterX className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
        No tickets match these filters — clear filters
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-5">
        Try broadening your search or resetting applied status, priority, or assignee filters.
      </p>
      {onClearFilters && (
        <button
          onClick={onClearFilters}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-medium rounded-lg transition-colors"
        >
          <span>Clear all filters</span>
        </button>
      )}
    </div>
  );
}

