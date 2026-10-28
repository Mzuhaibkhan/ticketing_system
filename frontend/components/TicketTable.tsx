import React from "react";
import Link from "next/link";
import { User, ChevronLeft, ChevronRight } from "lucide-react";
import { Ticket } from "@/lib/types";
import { StatusBadge } from "@/components/badges/StatusBadge";
import { PriorityBadge } from "@/components/badges/PriorityBadge";
import { OverdueBadge } from "@/components/badges/OverdueBadge";
import { formatRelativeTime, formatExactTime } from "@/lib/date";
import { cn } from "@/lib/utils";

interface TicketTableProps {
  tickets: Ticket[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  isLoading?: boolean;
}

export function TicketTable({
  tickets,
  total,
  page,
  pageSize,
  onPageChange,
  isLoading = false,
}: TicketTableProps) {
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);
  const totalPages = Math.ceil(total / pageSize) || 1;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-20">#ID</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4 w-36">Status</th>
                <th className="py-3 px-4 w-32">Priority</th>
                <th className="py-3 px-4 w-36">Assignee</th>
                <th className="py-3 px-4 w-32">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[...Array(6)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-4 px-4">
                    <div className="h-4 w-10 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4 w-20">#ID</th>
              <th className="py-3 px-4 min-w-[280px]">Subject</th>
              <th className="py-3 px-4 min-w-[180px]">Customer</th>
              <th className="py-3 px-4 w-36">Status</th>
              <th className="py-3 px-4 w-32">Priority</th>
              <th className="py-3 px-4 w-40">Assignee</th>
              <th className="py-3 px-4 w-32">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {tickets.map((ticket) => {
              const isOverdue = ticket.is_overdue;

              return (
                <tr
                  key={ticket.id}
                  className={cn(
                    "hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group",
                    isOverdue &&
                      "border-l-4 border-l-red-500 bg-red-50/20 dark:bg-red-950/10"
                  )}
                >
                  {/* #ID */}
                  <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                    #{ticket.id}
                  </td>

                  {/* Subject + Overdue badge */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col items-start gap-1">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="font-medium text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-1"
                      >
                        {ticket.subject}
                      </Link>
                      {isOverdue && (
                        <OverdueBadge
                          ageHours={ticket.age_hours}
                          size="sm"
                          className="mt-0.5"
                        />
                      )}
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="py-3.5 px-4 text-xs">
                    <div className="font-medium text-slate-800 dark:text-slate-200">
                      {ticket.customer_name || (
                        <span className="italic text-slate-400 font-normal">
                          No name provided
                        </span>
                      )}
                    </div>
                    {ticket.customer_email && (
                      <div className="text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                        {ticket.customer_email}
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <StatusBadge status={ticket.status} size="sm" />
                  </td>

                  {/* Priority */}
                  <td className="py-3.5 px-4">
                    <PriorityBadge priority={ticket.priority} size="sm" />
                  </td>

                  {/* Assignee */}
                  <td className="py-3.5 px-4 text-xs">
                    {ticket.assignee ? (
                      <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                        <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] text-slate-700 dark:text-slate-200 font-semibold">
                          {ticket.assignee.name.charAt(0)}
                        </div>
                        <span className="truncate max-w-[120px]">
                          {ticket.assignee.name}
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-400 italic">
                        <User className="w-3.5 h-3.5" />
                        <span>Unassigned</span>
                      </span>
                    )}
                  </td>

                  {/* Updated time (relative with hover tooltip) */}
                  <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400">
                    <span
                      title={formatExactTime(ticket.updated_at)}
                      className="cursor-help hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      {formatRelativeTime(ticket.updated_at)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div>
          Showing <span className="font-medium text-slate-700 dark:text-slate-300">{startItem}</span> to{" "}
          <span className="font-medium text-slate-700 dark:text-slate-300">{endItem}</span> of{" "}
          <span className="font-medium text-slate-700 dark:text-slate-300">{total}</span> tickets
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="p-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-medium text-slate-700 dark:text-slate-300">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="p-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

