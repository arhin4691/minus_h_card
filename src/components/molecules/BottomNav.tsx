'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Home, LayoutGrid, FolderHeart, Sparkles, Users } from 'lucide-react';

export default function BottomNav() {
  const t = useTranslations('nav');
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: t('home'), icon: Home },
    { href: '/gallery', label: t('gallery'), icon: LayoutGrid },
    { href: '/collection', label: t('collection'), icon: FolderHeart },
    { href: '/explore', label: t('explore'), icon: Sparkles },
    { href: '/friends', label: t('friends'), icon: Users },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-3">
      <div className="relative rounded-3xl bg-white/25 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/25 dark:border-white/10 shadow-lg overflow-hidden">
        {/* Glass reflection */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/10 rounded-3xl pointer-events-none" />
        <div className="relative flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'bg-[#fc88c6]/20 text-[#d4509a] dark:text-[#fc88c6]'
                    : 'text-slate-500 dark:text-slate-400 hover:text-[#fc88c6]'
                }`}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
