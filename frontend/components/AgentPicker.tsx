"use client";

import React from "react";
import { UserCheck, Shield, ChevronDown } from "lucide-react";
import { useActingAgent } from "@/context/acting-agent-context";

export function AgentPicker() {
  const { agents, actingAgent, actingAgentId, setActingAgentId, isLoading } = useActingAgent();

  if (isLoading) {
    return (
      <div className="h-9 w-44 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 hidden sm:inline">
        Acting as:
      </span>
      <div className="relative inline-flex items-center">
        <select
          value={actingAgentId ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            setActingAgentId(val ? Number(val) : null);
          }}
          className="appearance-none bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-medium rounded-lg pl-8 pr-8 py-1.5 shadow-2xs hover:border-slate-400 dark:hover:border-slate-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-colors cursor-pointer"
          aria-label="Acting as agent selector"
        >
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name} ({agent.role})
            </option>
          ))}
        </select>
        <div className="absolute left-2.5 pointer-events-none text-indigo-600 dark:text-indigo-400">
          {actingAgent?.role === "admin" ? (
            <Shield className="w-4 h-4" />
          ) : (
            <UserCheck className="w-4 h-4" />
          )}
        </div>
        <div className="absolute right-2.5 pointer-events-none text-slate-400">
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}

