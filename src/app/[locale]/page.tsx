'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import GlassCard from '@/components/atoms/GlassCard';
import GlassButton from '@/components/atoms/GlassButton';
import { Sparkles, FolderHeart, ArrowRight } from 'lucide-react';
import { useGenerations } from '@/hooks/useGenerations';

export default function HomePage() {
  const t = useTranslations('home');
  const { data: generations } = useGenerations();

  const sortedGenerations = useMemo(() => {
    if (!generations) return [];
    return [...generations].sort(
      (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime(),
    );
  }, [generations]);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center py-16 md:py-24"
      >
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
          className="flex justify-center mb-6"
        >
          <Image
            src="/title/title.png"
            alt="Minus H"
            width={160}
            height={120}
            className="object-contain drop-shadow-[0_0_24px_rgba(252,136,198,0.6)]"
            priority
          />
        </motion.div>

        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
            {t('hero')}
          </span>
        </h1>

        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-xl mx-auto mb-8">
          {t('subtitle')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/explore">
            <GlassButton variant="primary" size="lg">
              <Sparkles size={20} />
              {t('startExploring')}
            </GlassButton>
          </Link>
          <Link href="/collection">
            <GlassButton variant="secondary" size="lg">
              <FolderHeart size={20} />
              {t('viewCollection')}
            </GlassButton>
          </Link>
        </div>
      </motion.section>

      {/* Collections Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {t('collections')}
          </h2>
          <Link href="/gallery">
            <GlassButton variant="ghost" size="sm">
              {t('browseAll')}
              <ArrowRight size={14} />
            </GlassButton>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto xl:max-w-none">
          {sortedGenerations.length > 0
            ? sortedGenerations.map((gen, index) => (
                <motion.div
                  key={gen._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                >
                  <Link href="/gallery">
                    <GlassCard hover={false} className="overflow-hidden cursor-pointer group">
                      {/* Cover image */}
                      <div className="relative w-full aspect-video overflow-hidden rounded-t-3xl">
                        <Image
                          src={`/collections/cover/${gen.code}.png`}
                          alt={gen.nameJa}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {index === 0 && (
                          <span className="absolute top-3 left-3 bg-[#fc88c6] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md">
                            {t('newRelease')}
                          </span>
                        )}
                        <span className="absolute top-3 right-3 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-md backdrop-blur-sm tracking-wide">
                          {gen.code}
                        </span>
                      </div>

                      <div className="p-4">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 leading-tight">
                          {gen.nameJa}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {gen.description}
                        </p>
                      </div>
                    </GlassCard>
                  </Link>
                </motion.div>
              ))
            : [...Array(2)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <GlassCard hover={false} className="overflow-hidden">
                    <div className="w-full aspect-video bg-slate-200 dark:bg-slate-700 rounded-t-3xl" />
                    <div className="p-4 space-y-2">
                      <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                    </div>
                  </GlassCard>
                </div>
              ))}
        </div>
      </section>
    </div>
  );
}
