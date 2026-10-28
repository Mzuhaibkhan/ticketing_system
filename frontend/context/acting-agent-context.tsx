"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/constants";
import { Agent, LoginPayload } from "@/lib/types";

interface ActingAgentContextValue {
  agents: Agent[];
  actingAgent: Agent | null;
  actingAgentId: number | null;
  setActingAgentId: (id: number | null) => void;
  isLoading: boolean;
  user: Agent | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
}

const ActingAgentContext = createContext<ActingAgentContextValue | undefined>(undefined);

const STORAGE_KEY = "support_desk_acting_agent_id";

export function ActingAgentProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<Agent | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [actingAgentId, setActingAgentIdState] = useState<number | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = parseInt(stored, 10);
          if (!isNaN(parsed)) return parsed;
        }
      } catch {
        // localStorage suppressed
      }
    }
    return null;
  });

  // Load authenticated agent from /api/auth/me on mount
  useEffect(() => {
    let mounted = true;
    api
      .getMe()
      .then((agent) => {
        if (mounted) {
          setUser(agent);
          setActingAgentIdState(agent.id);
        }
      })
      .catch(() => {
        if (mounted) {
          setUser(null);
        }
      })
      .finally(() => {
        if (mounted) {
          setAuthLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const { data: agents = [], isLoading: agentsLoading } = useQuery<Agent[]>({
    queryKey: QUERY_KEYS.agents,
    queryFn: () => api.getAgents(),
    staleTime: 5 * 60 * 1000,
  });

  const actingAgent =
    user ||
    (actingAgentId !== null ? agents.find((a) => a.id === actingAgentId) : null) ||
    agents[0] ||
    null;

  const effectiveId = actingAgent?.id ?? null;

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

  const login = useCallback(
    async (payload: LoginPayload) => {
      const res = await api.login(payload);
      if (typeof window !== "undefined") {
        localStorage.setItem("supportdesk_token", res.token);
        localStorage.setItem(STORAGE_KEY, String(res.agent.id));
      }
      setUser(res.agent);
      setActingAgentIdState(res.agent.id);
      queryClient.invalidateQueries();
    },
    [queryClient]
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Ignore
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("supportdesk_token");
      localStorage.removeItem(STORAGE_KEY);
    }
    setUser(null);
    setActingAgentIdState(null);
    queryClient.clear();
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/login";
    }
  }, [queryClient]);

  const isAdmin = actingAgent?.role === "admin";
  const isAuthenticated = !!user;

  return (
    <ActingAgentContext.Provider
      value={{
        agents,
        actingAgent,
        actingAgentId: effectiveId,
        setActingAgentId,
        isLoading: agentsLoading || authLoading,
        user,
        isAuthenticated,
        isAdmin,
        login,
        logout,
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
