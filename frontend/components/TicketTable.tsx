import React from "react";
import Link from "next/link";
import { User, ChevronLeft, ChevronRight, Clock, CheckCircle } from "lucide-react";
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
      <div className="bg-[#201a18] border border-[#2a2420] rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1a1614] border-b border-[#2a2420] text-[11px] text-[#8c7e77] font-mono uppercase tracking-widest">
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
            <tbody className="divide-y divide-[#2a2420]">
              {[...Array(6)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-4 px-4">
                    <div className="h-4 w-10 bg-[#2a2420] rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 w-48 bg-[#2a2420] rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 w-28 bg-[#2a2420] rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-6 w-20 bg-[#2a2420] rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-6 w-20 bg-[#2a2420] rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 w-24 bg-[#2a2420] rounded" />
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 w-16 bg-[#2a2420] rounded" />
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
    <div className="bg-[#201a18] border border-[#2a2420] rounded-lg overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead
            className="bg-[#1a1614] border-b border-[#2a2420] text-[11px] text-[#8c7e77] font-mono uppercase tracking-widest"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <tr>
              <th className="py-3.5 px-4 w-20">#ID</th>
              <th className="py-3.5 px-4 min-w-[280px]">Subject</th>
              <th className="py-3.5 px-4 min-w-[180px]">Customer</th>
              <th className="py-3.5 px-4 w-36">Status</th>
              <th className="py-3.5 px-4 w-32">Priority</th>
              <th className="py-3.5 px-4 w-40">Assignee</th>
              <th className="py-3.5 px-4 w-32">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2a2420]">
            {tickets.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-12 text-center text-[#8c7e77] font-mono text-xs uppercase tracking-widest"
                >
                  NO TICKETS FOUND IN THIS VIEW
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => {
              const isOverdue = ticket.is_overdue;

              return (
                <tr
                  key={ticket.id}
                  className={cn(
                    "hover:bg-[#261f1c] transition-colors group",
                    isOverdue &&
                      "border-l-4 border-l-[#ff6e14] bg-[#ff6e14]/5"
                  )}
                >
                  {/* #ID */}
                  <td
                    className="py-4 px-4 font-mono text-xs font-bold text-[#ff6e14]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    #{ticket.id}
                  </td>

                  {/* Subject + Overdue & SLA badge */}
                  <td className="py-4 px-4">
                    <div className="flex flex-col items-start gap-1">
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="font-medium text-[#e3e3db] group-hover:text-[#ff6e14] transition-colors line-clamp-1"
                      >
                        {ticket.subject}
                      </Link>
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                        {isOverdue && (
                          <OverdueBadge
                            ageHours={ticket.age_hours}
                            size="sm"
                          />
                        )}
                        {ticket.sla_breached ? (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-red-950/40 text-red-400 border border-red-500/30"
                            title={`SLA Target: ${ticket.sla_target_hours}h`}
                          >
                            <Clock className="w-2.5 h-2.5" />
                            <span>SLA BREACHED</span>
                          </span>
                        ) : ticket.first_responded_at ? (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-[#26201d] text-[#8c7e77] border border-[#352f2b]"
                            title={`Responded within ${ticket.sla_target_hours}h target`}
                          >
                            <CheckCircle className="w-2.5 h-2.5 text-emerald-500" />
                            <span>SLA MET</span>
                          </span>
                        ) : ticket.status !== "resolved" ? (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-[#ff6e14]/10 text-[#ff8f3d] border border-[#ff6e14]/20"
                            title={`First response due in ${ticket.sla_target_hours}h`}
                          >
                            <Clock className="w-2.5 h-2.5 text-[#ff6e14]" />
                            <span>SLA {ticket.sla_target_hours || 4}H</span>
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </td>

                  {/* Customer */}
                  <td className="py-4 px-4 text-xs font-mono">
                    <div className="font-medium text-[#e3e3db]">
                      {ticket.customer_name || (
                        <span className="italic text-[#8c7e77] font-normal">
                          Anonymous
                        </span>
                      )}
                    </div>
                    {ticket.customer_email && (
                      <div className="text-[#8c7e77] truncate max-w-[200px] text-[11px]">
                        {ticket.customer_email}
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4">
                    <StatusBadge status={ticket.status} size="sm" />
                  </td>

                  {/* Priority */}
                  <td className="py-4 px-4">
                    <PriorityBadge priority={ticket.priority} size="sm" />
                  </td>

                  {/* Assignee */}
                  <td className="py-4 px-4 text-xs font-mono">
                    {ticket.assignee ? (
                      <div className="flex items-center gap-2 font-medium text-[#e3e3db]">
                        <div className="w-5 h-5 rounded-full bg-[#1a1614] border border-[#ff6e14] flex items-center justify-center text-[10px] text-[#ff6e14] font-bold">
                          {ticket.assignee.name.charAt(0)}
                        </div>
                        <span className="truncate max-w-[120px]">
                          {ticket.assignee.name}
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[#8c7e77] italic">
                        <User className="w-3.5 h-3.5" />
                        <span>Unassigned</span>
                      </span>
                    )}
                  </td>

                  {/* Updated time */}
                  <td className="py-4 px-4 text-xs text-[#8c7e77] font-mono">
                    <span
                      title={formatExactTime(ticket.updated_at)}
                      className="cursor-help hover:text-[#e3e3db]"
                    >
                      {formatRelativeTime(ticket.updated_at)}
                    </span>
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {total > pageSize && (
        <div
          className="px-4 py-3 bg-[#1a1614] border-t border-[#2a2420] flex items-center justify-between text-xs text-[#8c7e77] font-mono"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <div>
            SHOWING <span className="text-[#e3e3db] font-bold">{startItem}</span> -{" "}
            <span className="text-[#e3e3db] font-bold">{endItem}</span> OF{" "}
            <span className="text-[#ff6e14] font-bold">{total}</span> TICKETS
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="p-1.5 rounded-sm border border-[#352f2b] bg-[#251f1c] text-[#e3e3db] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#ff6e14] hover:text-[#ff6e14] transition-colors cursor-pointer"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono text-[#e3e3db]">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="p-1.5 rounded-sm border border-[#352f2b] bg-[#251f1c] text-[#e3e3db] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#ff6e14] hover:text-[#ff6e14] transition-colors cursor-pointer"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
