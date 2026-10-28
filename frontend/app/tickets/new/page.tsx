import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { TicketForm } from "@/components/TicketForm";

export default function NewTicketPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Link href="/tickets" className="hover:text-slate-800 dark:hover:text-slate-200">
          Tickets
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-800 dark:text-slate-200 font-medium">New Ticket</span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Create New Ticket
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Submit customer inquiries or internal tasks to the support workflow
        </p>
      </div>

      {/* Form */}
      <TicketForm />
    </div>
  );
}

