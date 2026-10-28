import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { TicketForm } from "@/components/TicketForm";

export default function NewTicketPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <nav
        className="flex items-center gap-2 text-xs font-mono text-[#8c7e77] uppercase tracking-wider"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        <Link href="/tickets" className="hover:text-[#ff6e14] transition-colors">
          TICKETS
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[#e3e3db]">NEW TICKET // 01</span>
      </nav>

      {/* Header */}
      <div className="border-b border-[#2a2420] pb-6">
        <div
          className="text-xs font-mono text-[#8c7e77] uppercase tracking-widest mb-2"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          INTAKE // DISPATCH
        </div>
        <h1
          className="text-5xl sm:text-7xl font-display uppercase tracking-tight text-[#e3e3db] leading-none"
          style={{ fontFamily: "var(--font-display)" }}
        >
          CREATE TICKET
        </h1>
        <p
          className="text-xs font-mono text-[#8c7e77] mt-2 uppercase tracking-wider"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          SUBMIT CUSTOMER INQUIRIES OR INTERNAL TASKS TO WORKFLOW
        </p>
      </div>

      {/* Form */}
      <TicketForm />
    </div>
  );
}
