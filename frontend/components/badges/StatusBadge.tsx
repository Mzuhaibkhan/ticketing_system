import React from "react";
import { Clock, Check } from "lucide-react";
import { STATUS_CONFIG } from "@/lib/constants";
import { TicketStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: TicketStatus;
  className?: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, className, size = "md" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.open;

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
      {config.icon === "clock" && <Clock className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />}
      {config.icon === "check" && <Check className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />}
      <span>{config.label}</span>
    </span>
  );
}
