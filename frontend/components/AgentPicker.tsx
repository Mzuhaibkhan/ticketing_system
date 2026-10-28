"use client";

import React from "react";
import Link from "next/link";
import { UserCheck, Shield, ChevronDown, LogOut, LogIn } from "lucide-react";
import { useActingAgent } from "@/context/acting-agent-context";

export function AgentPicker() {
  const { agents, actingAgent, actingAgentId, setActingAgentId, isLoading, isAuthenticated, logout } = useActingAgent();

  if (isLoading) {
    return (
      <div className="h-9 w-44 animate-pulse rounded-md bg-[#251f1c] border border-[#2a2420]" />
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className="font-mono text-[11px] tracking-wider uppercase text-[#8c7e77] hidden sm:inline"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        AGENT //
      </span>

      {/* Acting / Switcher dropdown */}
      <div className="relative inline-flex items-center">
        <select
          value={actingAgentId ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            setActingAgentId(val ? Number(val) : null);
          }}
          className="appearance-none bg-[#201a18] border border-[#352f2b] text-[#e3e3db] text-xs font-mono rounded-md pl-8 pr-8 py-1.5 shadow-sm hover:border-[#ff6e14] focus:outline-none focus:border-[#ff6e14] focus:ring-1 focus:ring-[#ff6e14] transition-colors cursor-pointer uppercase"
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
            <Shield className="w-3.5 h-3.5 text-[#ff6e14]" />
          ) : (
            <UserCheck className="w-3.5 h-3.5 text-[#8c7e77]" />
          )}
        </div>
        <div className="absolute right-2.5 pointer-events-none text-[#8c7e77]">
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Auth button */}
      {isAuthenticated ? (
        <button
          onClick={logout}
          title="Sign out of agent session"
          className="p-1.5 rounded-md bg-[#201a18] border border-[#352f2b] text-[#8c7e77] hover:text-[#ff6e14] hover:border-[#ff6e14] transition-colors flex items-center justify-center"
        >
          <LogOut className="w-4 h-4" />
        </button>
      ) : (
        <Link
          href="/login"
          title="Sign in with credentials"
          className="px-2.5 py-1.5 rounded-md bg-[#ff6e14]/20 border border-[#ff6e14]/50 text-[#ff6e14] hover:bg-[#ff6e14] hover:text-[#1a1614] text-xs font-mono font-bold uppercase transition-colors flex items-center gap-1.5"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <LogIn className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign In</span>
        </Link>
      )}
    </div>
  );
}
