'use client';

import { usePathname, useRouter } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { routing } from '@/i18n/routing';
import { motion, AnimatePresence } from 'framer-motion';

const localeLabels: Record<string, string> = {
  en: 'EN',
  'zh-HK': '繁中',
  ja: '日本語',
};

interface LanguageSwitcherProps {
  /** Open the dropdown upward (for use inside mobile menus) */
  upward?: boolean;
}

export default function LanguageSwitcher({ upward = false }: LanguageSwitcherProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function switchLocale(newLocale: string) {
    // Persist choice so the middleware redirects correctly on next visit
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    router.replace(pathname, { locale: newLocale, scroll: false } as Parameters<typeof router.replace>[1]);
    setOpen(false);
  }

  const dropdownPos = upward
    ? 'bottom-full mb-2 left-0'
    : 'top-full mt-2 right-0';

  const enterAnim = upward
    ? { opacity: 0, y: 8, scale: 0.95 }
    : { opacity: 0, y: -8, scale: 0.95 };

  const exitAnim = upward
    ? { opacity: 0, y: 8, scale: 0.95 }
    : { opacity: 0, y: -8, scale: 0.95 };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-600 dark:text-slate-300 text-sm transition-all border border-white/10 dark:border-white/5"
      >
        <Globe size={14} />
        {localeLabels[locale]}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={enterAnim}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={exitAnim}
            transition={{ duration: 0.15 }}
            className={`absolute ${dropdownPos} min-w-[110px] bg-white/80 dark:bg-slate-800/90 backdrop-blur-2xl border border-white/30 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden z-[100]`}
          >
            {routing.locales.map((loc) => (
              <button
                key={loc}
                onClick={() => switchLocale(loc)}
                className={`
                  w-full text-left px-4 py-2.5 text-sm transition-colors
                  ${loc === locale
                    ? 'bg-[#fc88c6]/20 text-[#d4509a] dark:text-[#fc88c6] font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-[#fc88c6]/10'}
                `}
              >
                {localeLabels[loc]}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
