'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useStore } from '@/stores/useStore';
import { Home, LayoutGrid, FolderHeart, Sparkles, User, Moon, Sun, Users } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import NotificationCenter from './NotificationCenter';
import { useDarkMode } from '@/hooks/useDarkMode';

export default function NavBar() {
  const t = useTranslations('nav');
  const { isLoggedIn, displayName } = useStore();
  const { isDark, toggle } = useDarkMode();

  const navItems = [
    { href: '/', label: t('home'), icon: Home },
    { href: '/gallery', label: t('gallery'), icon: LayoutGrid },
    { href: '/collection', label: t('collection'), icon: FolderHeart },
    { href: '/explore', label: t('explore'), icon: Sparkles },
    { href: '/friends', label: t('friends'), icon: Users },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full">
      <div className="mx-auto max-w-[1400px] px-4">
        <div className="relative mt-3 rounded-3xl bg-white/25 dark:bg-slate-900/60 backdrop-blur-2xl border border-white/25 dark:border-white/10 shadow-lg">
          {/* Glass reflection */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/10 rounded-3xl pointer-events-none" />

          <div className="relative flex items-center justify-between px-5 py-3">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <Image
                src="/title/title.png"
                alt="Minus H"
                width={56}
                height={42}
                className="object-contain drop-shadow-[0_0_6px_rgba(252,136,198,0.5)] group-hover:drop-shadow-[0_0_10px_rgba(252,136,198,0.8)] transition-all duration-300"
                priority
              />
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-white/20 hover:text-[#fc88c6] transition-all duration-200"
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Desktop right section */}
            <div className="hidden md:flex items-center gap-2">
              <LanguageSwitcher />
              <NotificationCenter />
              <button
                onClick={toggle}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-600 dark:text-slate-300 transition-all border border-white/10 dark:border-white/5"
                aria-label="Toggle dark mode"
              >
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              {isLoggedIn ? (
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#fc88c6]/20 hover:bg-[#fc88c6]/30 text-[#d4509a] dark:text-[#fc88c6] text-sm font-medium transition-all"
                >
                  <User size={16} />
                  {displayName}
                </Link>
              ) : (
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#fc88c6]/25 hover:bg-[#fc88c6]/40 text-[#d4509a] dark:text-[#fc88c6] text-sm font-medium border border-[#fc88c6]/30 transition-all"
                >
                  {t('login')}
                </Link>
              )}
            </div>

            {/* Mobile right: lang + notifications + dark mode + profile */}
            <div className="md:hidden flex items-center gap-2">
              <LanguageSwitcher />
              <NotificationCenter />
              <button
                onClick={toggle}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-600 dark:text-slate-300 transition-all border border-white/10"
                aria-label="Toggle dark mode"
              >
                {isDark ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              <Link
                href="/profile"
                className="p-2 rounded-xl bg-[#fc88c6]/20 hover:bg-[#fc88c6]/30 text-[#d4509a] dark:text-[#fc88c6] transition-all"
                aria-label="Profile"
              >
                <User size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
