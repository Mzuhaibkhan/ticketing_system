"use client";

import React from "react";
import { UserCheck, Shield, ChevronDown } from "lucide-react";
import { useActingAgent } from "@/context/acting-agent-context";

export function AgentPicker() {
  const { agents, actingAgent, actingAgentId, setActingAgentId, isLoading } = useActingAgent();

  if (isLoading) {
    return (
      <div className="h-9 w-44 animate-pulse rounded-md bg-[#251f1c] border border-[#2a2420]" />
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className="font-mono-cap text-[#8c7e77] hidden sm:inline"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        ACTING AS //
      </span>
      <div className="relative inline-flex items-center">
        <select
          value={actingAgentId ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            setActingAgentId(val ? Number(val) : null);
          }}
          className="appearance-none bg-[#201a18] border border-[#352f2b] text-[#e3e3db] text-xs font-mono rounded-md pl-8 pr-8 py-2 shadow-sm hover:border-[#ff6e14] focus:outline-hidden focus:border-[#ff6e14] focus:ring-1 focus:ring-[#ff6e14] transition-colors cursor-pointer uppercase"
          style={{ fontFamily: "var(--font-mono)" }}
          aria-label="Acting as agent selector"
        >
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id} className="bg-[#1a1614] text-[#e3e3db]">
              {agent.name} [{agent.role.toUpperCase()}]
            </option>
          ))}
        </select>
        <div className="absolute left-2.5 pointer-events-none text-[#ff6e14]">
          {actingAgent?.role === "admin" ? (
            <Shield className="w-3.5 h-3.5" />
          ) : (
            <UserCheck className="w-3.5 h-3.5" />
          )}
        </div>
        <div className="absolute right-2.5 pointer-events-none text-[#8c7e77]">
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
