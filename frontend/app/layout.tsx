import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Support Desk | Polite Chaos",
  description: "Customer support ticketing and activity system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full h-full bg-[#1a1614] text-[#e3e3db] font-sans flex overflow-hidden">
        <Providers>
          <div className="flex h-full w-full overflow-hidden bg-[#1a1614]">
            <Suspense
              fallback={
                <div className="w-64 flex-shrink-0 bg-[#1a1614] border-r border-[#2a2420] hidden md:block" />
              }
            >
              <Sidebar />
            </Suspense>
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
              <Suspense
                fallback={
                  <div className="h-16 border-b border-[#2a2420] bg-[#1a1614]" />
                }
              >
                <Header />
              </Suspense>
              <main className="flex-1 overflow-y-auto bg-[#1a1614] p-4 sm:p-8">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
