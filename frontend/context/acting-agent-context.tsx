"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import { Agent } from "@/lib/types";

interface ActingAgentContextValue {
  agents: Agent[];
  actingAgent: Agent | null;
  actingAgentId: number | null;
  setActingAgentId: (id: number | null) => void;
  isLoading: boolean;
}

const ActingAgentContext = createContext<ActingAgentContextValue | undefined>(undefined);

const STORAGE_KEY = "support_desk_acting_agent_id";

export function ActingAgentProvider({ children }: { children: React.ReactNode }) {
  const [actingAgentId, setActingAgentIdState] = useState<number | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const { data: agents = [], isLoading } = useQuery<Agent[]>({
    queryKey: QUERY_KEYS.agents,
    queryFn: () => api.getAgents(),
    staleTime: 5 * 60 * 1000,
  });

  // Load from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed)) {
          setActingAgentIdState(parsed);
        }
      }
    } catch {
      // localStorage unavailable / suppressed
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Default to first agent if not selected once agents load
  useEffect(() => {
    if (isHydrated && agents.length > 0) {
      if (actingAgentId === null || !agents.some((a) => a.id === actingAgentId)) {
        const defaultId = agents[0].id;
        setActingAgentIdState(defaultId);
        try {
          localStorage.setItem(STORAGE_KEY, String(defaultId));
        } catch {
          // Ignore storage errors
        }
      }
    }
  }, [isHydrated, agents, actingAgentId]);

  const setActingAgentId = (id: number | null) => {
    setActingAgentIdState(id);
    try {
      if (id !== null) {
        localStorage.setItem(STORAGE_KEY, String(id));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore
    }
  };

  const actingAgent = agents.find((a) => a.id === actingAgentId) || null;

  return (
    <ActingAgentContext.Provider
      value={{
        agents,
        actingAgent,
        actingAgentId,
        setActingAgentId,
        isLoading,
      }}
    >
      {children}
    </ActingAgentContext.Provider>
  );
}

export function useActingAgent() {
  const context = useContext(ActingAgentContext);
  if (!context) {
    throw new Error("useActingAgent must be used within an ActingAgentProvider");
  }
  return context;
}

