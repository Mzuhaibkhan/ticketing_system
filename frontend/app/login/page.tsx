"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useActingAgent } from "@/context/acting-agent-context";
import { Lock, Mail, ShieldAlert, ArrowRight } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") || "/";
  const { login } = useActingAgent();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      router.push(redirectUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setLoading(true);
    try {
      await login({ email: demoEmail, password: demoPass });
      router.push(redirectUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center w-full my-auto py-2">
      <div className="w-full max-w-md space-y-5 my-auto">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#201a18] border border-[#ff6e14]/40 text-[#ff6e14] mb-3">
            <Lock className="w-5 h-5" />
          </div>
          <h1
            className="text-3xl font-display font-black tracking-tight text-[#e3e3db] uppercase"
            style={{ fontFamily: "var(--font-display)" }}
          >
            SUPPORT DESK
          </h1>
          <p
            className="mt-1 text-xs font-mono uppercase tracking-widest text-[#8c7e77]"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            JWT Authentication & Role Access
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#201a18] border border-[#2a2420] rounded-xl p-6 sm:p-7 shadow-2xl space-y-5">
          {error && (
            <div className="bg-red-950/40 border border-red-500/40 rounded-md p-3 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p
                className="text-xs font-mono text-red-300 leading-relaxed"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {error}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-xs font-mono uppercase tracking-wider text-[#8c7e77] mb-1.5"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Agent Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-[#8c7e77]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-[#1a1614] border border-[#2a2420] rounded-md text-sm text-[#e3e3db] placeholder-[#8c7e77]/50 focus:outline-none focus:border-[#ff6e14] font-mono"
                  style={{ fontFamily: "var(--font-mono)" }}
                />
              </div>
            </div>

            <div>
              <label
                className="block text-xs font-mono uppercase tracking-wider text-[#8c7e77] mb-1.5"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-[#8c7e77]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-[#1a1614] border border-[#2a2420] rounded-md text-sm text-[#e3e3db] placeholder-[#8c7e77]/50 focus:outline-none focus:border-[#ff6e14] font-mono"
                  style={{ fontFamily: "var(--font-mono)" }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-[#ff6e14] hover:bg-[#ff7e2e] text-[#1a1614] rounded-md font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="pt-4 border-t border-[#2a2420]">
            <p
              className="text-[11px] font-mono uppercase tracking-wider text-[#8c7e77] mb-3 text-center"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Instant Demo Access
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin("admin@example.com", "password123")}
                className="p-2.5 bg-[#1a1614] border border-[#2a2420] hover:border-[#ff6e14] rounded-md text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-mono font-bold text-[#e3e3db] group-hover:text-[#ff6e14]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    Admin User
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-[#ff6e14]/20 text-[#ff6e14] font-bold">
                    ADMIN
                  </span>
                </div>
                <span
                  className="text-[10px] text-[#8c7e77] font-mono block mt-0.5"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  admin@example.com
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin("agent@example.com", "password123")}
                className="p-2.5 bg-[#1a1614] border border-[#2a2420] hover:border-[#ff6e14] rounded-md text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-mono font-bold text-[#e3e3db] group-hover:text-[#ff6e14]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    Agent User
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-[#2a2420] text-[#e3e3db] font-bold">
                    AGENT
                  </span>
                </div>
                <span
                  className="text-[10px] text-[#8c7e77] font-mono block mt-0.5"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  agent@example.com
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin("sarah@example.com", "password123")}
                className="p-2.5 bg-[#1a1614] border border-[#2a2420] hover:border-[#ff6e14] rounded-md text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-mono font-bold text-[#e3e3db] group-hover:text-[#ff6e14]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    Sarah Chen
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-[#ff6e14]/20 text-[#ff6e14] font-bold">
                    ADMIN
                  </span>
                </div>
                <span
                  className="text-[10px] text-[#8c7e77] font-mono block mt-0.5"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  sarah@example.com
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin("alex@example.com", "password123")}
                className="p-2.5 bg-[#1a1614] border border-[#2a2420] hover:border-[#ff6e14] rounded-md text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-mono font-bold text-[#e3e3db] group-hover:text-[#ff6e14]"
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    Alex Rivera
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-[#2a2420] text-[#e3e3db] font-bold">
                    AGENT
                  </span>
                </div>
                <span
                  className="text-[10px] text-[#8c7e77] font-mono block mt-0.5"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  alex@example.com
                </span>
              </button>
            </div>
            <p
              className="text-[10px] text-[#8c7e77] font-mono text-center mt-2.5"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              Demo Password: <span className="text-[#e3e3db]">password123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex-1 bg-[#1a1614]" />}>
      <LoginForm />
    </Suspense>
  );
}
