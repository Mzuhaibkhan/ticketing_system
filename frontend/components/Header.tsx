"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LayoutDashboard, Ticket, PlusCircle } from "lucide-react";
import { AgentPicker } from "./AgentPicker";
import { cn } from "@/lib/utils";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, exact: true },
    { name: "Tickets", href: "/tickets", icon: Ticket, exact: false },
    { name: "New Ticket", href: "/tickets/new", icon: PlusCircle, exact: true },
  ];

  return (
    <header className="h-16 border-b border-[#2a2420] bg-[#1a1614] sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 text-[#e3e3db]">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[#8c7e77] hover:text-[#e3e3db] hover:bg-[#251f1c] rounded-md transition-colors"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5 text-[#ff6e14]" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Mobile brand */}
        <div className="flex items-center gap-2 md:hidden">
          <span className="w-2 h-2 rounded-full bg-[#ff6e14]" />
          <span
            className="font-display text-xl tracking-tight uppercase text-[#e3e3db]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            SUPPORT DESK
          </span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        <AgentPicker />
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-[#1a1614] border-b border-[#2a2420] p-4 md:hidden shadow-2xl space-y-2">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href) && (item.href !== "/" || pathname === "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center justify-between px-4 py-2.5 rounded-md text-base font-display uppercase tracking-tight transition-colors",
                  isActive
                    ? "bg-[#251f1c] text-[#ff6e14] border border-[#ff6e14]"
                    : "text-[#8c7e77] hover:text-[#e3e3db] hover:bg-[#201a18]"
                )}
                style={{ fontFamily: "var(--font-display)" }}
              >
                <span>{item.name}</span>
                <span className="text-xs font-mono text-[#8c7e77]">→</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
