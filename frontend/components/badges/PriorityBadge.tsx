import React from "react";
import { ChevronUp, ChevronsUp, Flame } from "lucide-react";
import { PRIORITY_CONFIG } from "@/lib/constants";
import { TicketPriority } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PriorityBadgeProps {
  priority: TicketPriority;
  className?: string;
  size?: "sm" | "md";
}

export function PriorityBadge({ priority, className, size = "md" }: PriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 uppercase tracking-wider rounded-sm border transition-colors",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        config.badgeClass,
        className
      )}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {config.isUrgent ? (
        <Flame className={size === "sm" ? "w-3 h-3 text-[#1a1614] fill-[#1a1614]" : "w-3.5 h-3.5 text-[#1a1614] fill-[#1a1614]"} />
      ) : config.chevronCount === 2 ? (
        <ChevronsUp className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      ) : (
        <ChevronUp className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      )}
      <span>{config.label}</span>
    </span>
  );
}
