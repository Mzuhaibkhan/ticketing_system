"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ActingAgentProvider } from "@/context/acting-agent-context";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: (failureCount, error: unknown) => {
              // Don't retry 404 or 422
              if (
                error &&
                typeof error === "object" &&
                "status" in error &&
                (error.status === 404 || error.status === 422)
              ) {
                return false;
              }
              return failureCount < 2;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ActingAgentProvider>
        {children}
        <Toaster position="bottom-right" richColors closeButton />
      </ActingAgentProvider>
    </QueryClientProvider>
  );
}

