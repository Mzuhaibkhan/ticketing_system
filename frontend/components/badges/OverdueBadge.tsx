import React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface OverdueBadgeProps {
  ageHours?: number;
  className?: string;
  size?: "sm" | "md";
}

export function OverdueBadge({ ageHours, className, size = "md" }: OverdueBadgeProps) {
  const text =
    ageHours !== undefined && ageHours !== null
      ? `OVERDUE // ${Math.round(ageHours)}H`
      : "OVERDUE";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-sm border border-[#ff6e14] bg-[#ff6e14] text-[#1a1614] shadow-xs",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      <AlertCircle className={size === "sm" ? "w-3 h-3 text-[#1a1614]" : "w-3.5 h-3.5 text-[#1a1614]"} />
      <span>{text}</span>
    </span>
  );
}
