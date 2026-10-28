import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Support Desk System",
  description: "Customer support ticketing and activity system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex overflow-hidden">
        <Providers>
          <div className="flex h-full w-full overflow-hidden">
            <Suspense fallback={<div className="w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800 hidden md:block" />}>
              <Sidebar />
            </Suspense>
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
              <Suspense fallback={<div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900" />}>
                <Header />
              </Suspense>
              <main className="flex-1 overflow-y-auto">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
