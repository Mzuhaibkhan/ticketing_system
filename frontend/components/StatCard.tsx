import React from "react";
import Link from "next/link";
import { LucideIcon, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  count: number | undefined;
  href: string;
  icon: LucideIcon;
  colorClass?: string;
  accentBgClass?: string;
  loading?: boolean;
  subtitle?: string;
}

export function StatCard({
  title,
  count,
  href,
  icon: Icon,
  loading = false,
  subtitle,
}: StatCardProps) {
  return (
    <Link
      href={href}
      className="group relative bg-[#201a18] border border-[#2a2420] rounded-lg p-6 shadow-sm hover:border-[#ff6e14] hover:bg-[#251f1c] transition-all duration-200 flex flex-col justify-between"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <span
            className="text-xs font-mono uppercase tracking-widest text-[#8c7e77] block"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {title}
          </span>
          {subtitle && (
            <span
              className="text-[11px] text-[#8c7e77]/70 font-mono mt-0.5 block"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {subtitle}
            </span>
          )}
        </div>
        <div className="w-10 h-10 rounded-md bg-[#1a1614] border border-[#352f2b] group-hover:border-[#ff6e14] flex items-center justify-center transition-colors flex-shrink-0">
          <Icon className="w-5 h-5 text-[#ff6e14]" />
        </div>
      </div>

      <div className="flex items-baseline justify-between mt-2">
        {loading ? (
          <div className="h-12 w-20 bg-[#2a2420] rounded animate-pulse" />
        ) : (
          <span
            className="text-5xl font-display font-black tracking-tight text-[#e3e3db] group-hover:text-[#ff6e14] transition-colors leading-none"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {count ?? 0}
          </span>
        )}

        <span
          className="inline-flex items-center text-xs font-mono font-bold tracking-wider text-[#8c7e77] group-hover:text-[#ff6e14] transition-colors uppercase"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <span>VIEW</span>
          <ArrowUpRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      </div>
    </Link>
  );
}
