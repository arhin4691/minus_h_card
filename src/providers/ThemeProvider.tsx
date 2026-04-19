import { type ReactNode } from 'react';

interface ThemeProviderProps {
  children: ReactNode;
}

// Server component — no 'use client' needed, no hooks, no script tags
export default function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-900 transition-colors duration-500">
      {/* Ambient blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#fc88c6]/20 blur-3xl dark:bg-[#fc88c6]/10" />
        <div className="absolute top-1/3 -left-40 h-[500px] w-[500px] rounded-full bg-purple-200/25 blur-3xl dark:bg-purple-900/20" />
        <div className="absolute -bottom-40 right-1/4 h-80 w-80 rounded-full bg-blue-200/25 blur-3xl dark:bg-blue-900/15" />
        <div className="absolute top-2/3 left-1/3 h-64 w-64 rounded-full bg-[#fc88c6]/10 blur-3xl dark:bg-[#fc88c6]/5" />
      </div>
      {children}
    </div>
  );
}
