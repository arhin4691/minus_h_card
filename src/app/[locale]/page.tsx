'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import GlassCard from '@/components/atoms/GlassCard';
import GlassButton from '@/components/atoms/GlassButton';
import { Sparkles, FolderHeart } from 'lucide-react';

export default function HomePage() {
  const t = useTranslations('home');

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

      {/* Featured Cards Section */}
      <section>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6 text-center">
          {t('featuredCards')}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-6 max-w-4xl mx-auto xl:max-w-none">
          {/* Card previews */}
          {[
            {
              emoji: '🌸',
              title: 'Sakura Spirit',
              desc: 'A gentle card carrying the essence of spring',
              gradient: 'from-pink-200/40 to-rose-200/40',
            },
            {
              emoji: '⚡',
              title: 'Thunder Bloom',
              desc: 'Electric energy wrapped in floral beauty',
              gradient: 'from-amber-200/40 to-yellow-200/40',
            },
            {
              emoji: '💎',
              title: 'Crystal Moon',
              desc: 'A legendary card reflecting moonlit dreams',
              gradient: 'from-blue-200/40 to-purple-200/40',
            },
          ].map((card) => (
            <motion.div
              key={card.title}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <GlassCard className="p-6">
                <div
                  className={`w-full aspect-[3/4] rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4`}
                >
                  <span className="text-5xl">{card.emoji}</span>
                </div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                  {card.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {card.desc}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
