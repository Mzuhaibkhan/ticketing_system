"use client";

import { useEffect, useState } from "react";

interface HealthData {
  status: string;
  database: string;
  version: string;
}

export default function Home() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  const checkHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/health`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setHealth(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to connect to backend API");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-700 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Support Desk System</h1>
            <p className="text-sm text-slate-400">Phase 1: Setup & Foundations</p>
          </div>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Phase 1 Active
          </span>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">API Health Verification</h2>
          <div className="bg-slate-950/60 rounded-lg p-4 border border-slate-700/60 space-y-3 font-mono text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Target Endpoint:</span>
              <span className="text-sky-400">{apiUrl}/health</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Status:</span>
              {loading ? (
                <span className="text-amber-400 animate-pulse">Checking connection...</span>
              ) : error ? (
                <span className="text-rose-400 font-semibold">Offline ({error})</span>
              ) : (
                <span className="text-emerald-400 font-semibold">200 OK ({health?.status})</span>
              )}
            </div>

            {health && (
              <div className="flex justify-between">
                <span className="text-slate-400">Database:</span>
                <span className="text-emerald-300 font-medium">{health.database}</span>
              </div>
            )}
          </div>
        </div>

        <div className="pt-2 flex gap-3">
          <button
            onClick={checkHealth}
            disabled={loading}
            className="flex-1 py-2 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Pinging API..." : "Re-check Health"}
          </button>
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="py-2 px-4 rounded-lg border border-slate-700 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
          >
            Open /docs
          </a>
        </div>
      </div>
    </div>
  );
}
