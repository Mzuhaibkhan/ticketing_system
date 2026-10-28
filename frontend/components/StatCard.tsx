import React from "react";
import Link from "next/link";
import { LucideIcon, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  count: number | undefined;
  href: string;
  icon: LucideIcon;
  colorClass: string;
  accentBgClass: string;
  loading?: boolean;
}

export function StatCard({
  title,
  count,
  href,
  icon: Icon,
  colorClass,
  accentBgClass,
  loading = false,
}: StatCardProps) {
  return (
    <Link
      href={href}
      className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        <div
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105",
            accentBgClass
          )}
        >
          <Icon className={cn("w-5 h-5", colorClass)} />
        </div>
      </div>

      <div className="flex items-baseline justify-between">
        {loading ? (
          <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        ) : (
          <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {count ?? 0}
          </span>
        )}

        <span className="inline-flex items-center text-xs font-medium text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          <span>View</span>
          <ArrowUpRight className="w-3.5 h-3.5 ml-0.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </span>
      </div>
    </Link>
  );
}

