"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Ticket, PlusCircle, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    name: "Dashboard",
    code: "01",
    href: "/",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    name: "Tickets",
    code: "02",
    href: "/tickets",
    icon: Ticket,
    exact: false,
  },
  {
    name: "New Ticket",
    code: "03",
    href: "/tickets/new",
    icon: PlusCircle,
    exact: true,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 bg-[#1a1614] border-r border-[#2a2420] text-[#e3e3db] flex flex-col justify-between hidden md:flex select-none">
      <div>
        {/* Brand header */}
        <div className="p-6 border-b border-[#2a2420]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff6e14] shadow-sm shadow-[#ff6e14]/50" />
            <span
              className="font-mono-cap text-[#8c7e77]"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              System // 101
            </span>
          </div>

          <Link href="/" className="block mt-2 group">
            <h1
              className="text-4xl font-display tracking-tight text-[#e3e3db] group-hover:text-[#ff6e14] transition-colors"
              style={{ fontFamily: "var(--font-display)" }}
            >
              SUPPORT<br />DESK
            </h1>
          </Link>
        </div>

        {/* Navigation links */}
        <nav className="p-4 space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href) &&
                (item.href !== "/" || pathname === "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center justify-between px-4 py-3 rounded-md transition-all duration-150 border",
                  isActive
                    ? "bg-[#251f1c] border-[#ff6e14] text-[#ff6e14] shadow-sm"
                    : "border-transparent text-[#8c7e77] hover:text-[#e3e3db] hover:bg-[#201a18] hover:border-[#2a2420]"
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-[10px] font-mono font-medium text-[#8c7e77] group-hover:text-[#ff6e14]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {item.code}
                  </span>
                  <span
                    className="text-xl font-display tracking-tight uppercase"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {item.name}
                  </span>
                </div>
                <ArrowUpRight
                  className={cn(
                    "w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5",
                    isActive ? "opacity-100 text-[#ff6e14]" : "opacity-0 group-hover:opacity-100 text-[#8c7e77]"
                  )}
                />
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / System info */}
      <div className="p-5 border-t border-[#2a2420] text-xs">
        <div className="flex items-center justify-between mb-1">
          <span
            className="font-mono-cap text-[#8c7e77]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            STATUS
          </span>
          <span className="flex items-center gap-1.5 text-[#ff6e14] font-mono text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff6e14] animate-pulse" />
            ONLINE
          </span>
        </div>
        <p
          className="text-[#8c7e77] text-[11px] font-mono mt-1"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          &copy; POLITE CHAOS DEPT.
        </p>
      </div>
    </aside>
  );
}
