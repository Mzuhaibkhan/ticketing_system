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
      ? `Overdue · ${Math.round(ageHours)}h`
      : "Overdue";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold rounded-full border border-red-500 bg-red-50/80 text-red-700 dark:bg-red-950/40 dark:border-red-600 dark:text-red-300",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs sm:text-sm",
        className
      )}
    >
      <AlertCircle className={size === "sm" ? "w-3 h-3 text-red-600 dark:text-red-400" : "w-3.5 h-3.5 text-red-600 dark:text-red-400"} />
      <span>{text}</span>
    </span>
  );
}

