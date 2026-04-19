'use client';

import { type ReactNode } from 'react';
import NavBar from '@/components/molecules/NavBar';
import BottomNav from '@/components/molecules/BottomNav';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>
      <footer className="hidden md:block w-full py-6 text-center">
        <div className="mx-auto max-w-[1400px] px-4">
          <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/10 py-4 px-6">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              ✿ Minus H Card © 2026 — Made with love
            </p>
          </div>
        </div>
      </footer>
      <BottomNav />
    </div>
  );
}
