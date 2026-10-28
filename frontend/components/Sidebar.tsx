"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  LifeBuoy,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    name: "Tickets",
    href: "/tickets",
    icon: Ticket,
    exact: false,
  },
  {
    name: "New Ticket",
    href: "/tickets/new",
    icon: PlusCircle,
    exact: true,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between hidden md:flex">
      <div>
        {/* Brand header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
            <LifeBuoy className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-white tracking-tight text-base block">
              Support Desk
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-indigo-400 block -mt-1">
              Agent Portal
            </span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="p-4 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href) &&
                (item.href !== "/" || pathname === "/");

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-indigo-600 text-white shadow-xs font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/70"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-400")} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / System status */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Core System Active</span>
        </div>
        <span className="text-[11px] font-mono text-slate-600">v1.0</span>
      </div>
    </aside>
  );
}

