'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useCards, useCollection } from '@/hooks/useCards';
import { useGenerations } from '@/hooks/useGenerations';
import { useStore } from '@/stores/useStore';
import CardContainer from '@/components/molecules/CardContainer';
import CardDetailModal from '@/components/molecules/CardDetailModal';
import GlassInput from '@/components/atoms/GlassInput';
import GlassButton from '@/components/atoms/GlassButton';
import GlassCard from '@/components/atoms/GlassCard';
import type { CardRarity } from '@/models/Card';
import { Search, Filter, Layers } from 'lucide-react';
import { motion, LayoutGroup } from 'framer-motion';

const RARITIES: (CardRarity | 'all')[] = [
  'all', 'common', 'uncommon', 'rare', 'superRare', 'epic', 'legendary',
];

const PAGE_SIZE = 15;

interface CardData {
  _id: string;
  name: string;
  information: string;
  rarity: CardRarity;
  image: string;
  generation: string;
}

export default function CardGallery() {
  const t = useTranslations('gallery');
  const {
    activeRarityFilter, searchQuery, activeGenerationFilter,
    setRarityFilter, setSearchQuery, setGenerationFilter,
    userId, isLoggedIn,
  } = useStore();
  const { data: cards, isLoading } = useCards(activeRarityFilter, searchQuery, activeGenerationFilter);
  const { data: collection } = useCollection(userId);
  const { data: generations } = useGenerations();
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);

  // Infinite scroll
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset pagination whenever the filtered card list changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [cards]);

  // Observe the sentinel to load next batch
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((prev) => prev + PAGE_SIZE);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  });

  // Shrinking sticky bar — track how far past the sticky point we've scrolled
  const barRef = useRef<HTMLDivElement>(null);
  const barOriginRef = useRef<number | null>(null);
  const STICKY_TOP_PX = 100; // matches sticky top-25 (6.25 rem)
  const [compactAmount, setCompactAmount] = useState(0); // 0 = full, 1 = fully compact

  useEffect(() => {
    function measureOrigin() {
      if (barRef.current && barOriginRef.current === null) {
        barOriginRef.current = barRef.current.getBoundingClientRect().top + window.scrollY;
      }
    }
    measureOrigin();

    function onScroll() {
      measureOrigin();
      const origin = barOriginRef.current ?? 0;
      // how much extra the user has scrolled PAST the sticky lock-in point
      const overScroll = Math.max(0, window.scrollY - (origin - STICKY_TOP_PX));
      // 0 → full size, 1 → mini (clamp to 1 within 80px of extra scroll)
      setCompactAmount(Math.min(1, overScroll / 80));
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Derived compact boolean (past half-way → compact layout)
  const isCompact = compactAmount > 0.5;

  // Build a Set of owned card IDs for O(1) lookup
  const ownedIds = useMemo(
    () => new Set(collection?.map((c) => c.cardId._id) ?? []),
    [collection],
  );

  return (
    <LayoutGroup>
      <div className="space-y-6">
        {/* ── Filters ── */}
        <div ref={barRef} className="sticky top-25 z-50">
          <GlassCard
            hover={false}
            className="overflow-hidden transition-all duration-300"
          >
            <div
              className="transition-all duration-300"
              style={{ padding: isCompact ? '0.375rem 0.75rem' : '1.25rem' }}
            >
            {/* Search row — always visible */}
            <div className={`flex flex-col sm:flex-row gap-4 transition-all duration-300 ${isCompact ? 'mb-0' : 'mb-3'}`}>
              <div className="flex-1">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <GlassInput
                    placeholder={t('filterByName')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-9 transition-all duration-300 ${isCompact ? 'py-1 text-sm' : ''}`}
                  />
                </div>
              </div>
              {/* Rarity filters — collapse into a single row when compact */}
              <div className={`flex items-center gap-1.5 transition-all duration-300 ${isCompact ? 'hidden sm:flex' : 'flex'}`}>
                <Filter size={14} className="text-slate-400 mr-1" />
                <div className="flex flex-wrap gap-1.5">
                  {RARITIES.map((r) => (
                    <GlassButton
                      key={r}
                      size="sm"
                      variant={activeRarityFilter === r ? 'primary' : 'ghost'}
                      onClick={() => setRarityFilter(r)}
                    >
                      {r === 'all' ? t('filterByRarity') : t(`rarities.${r}`)}
                    </GlassButton>
                  ))}
                </div>
              </div>
            </div>

            {/* Generation filter row — hidden when compact */}
            {!isCompact && generations && generations.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Layers size={14} className="text-slate-400 mr-1" />
                <div className="flex flex-wrap gap-1.5">
                  <GlassButton
                    size="sm"
                    variant={activeGenerationFilter === 'all' ? 'primary' : 'ghost'}
                    onClick={() => setGenerationFilter('all')}
                  >
                    {t('generations.all')}
                  </GlassButton>
                  {generations.map((gen) => (
                    <GlassButton
                      key={gen._id}
                      size="sm"
                      variant={activeGenerationFilter === gen.code ? 'primary' : 'ghost'}
                      onClick={() => setGenerationFilter(gen.code)}
                    >
                      <span>{gen.code}</span>
                      {activeGenerationFilter === gen.code && (
                        <span className="hidden sm:inline ml-1 opacity-75 text-[10px] font-normal">
                          {gen.nameJa.split('—')[0].trim()}
                        </span>
                      )}
                    </GlassButton>
                  ))}
                </div>
              </div>
            )}
            </div>
          </GlassCard>
        </div>

        {/* ── Card grid ── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              className="w-8 h-8 border-2 border-[#fc88c6]/60 border-t-transparent rounded-full"
            />
          </div>
        ) : cards && cards.length > 0 ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 justify-items-center"
          >
            {cards.slice(0, visibleCount).map((card) => (
              <motion.div
                key={card._id}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                className="w-full"
              >
                <CardContainer
                  id={card._id}
                  name={card.name}
                  information={card.information}
                  rarity={card.rarity}
                  image={card.image}
                  generation={card.generation || undefined}
                  owned={isLoggedIn ? ownedIds.has(card._id) : false}
                  layoutId={`card-zoom-${card._id}`}
                  onClick={() => setSelectedCard(card as CardData)}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <GlassCard hover={false} className="p-12 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-lg">{t('noCards')}</p>
            <span className="text-4xl mt-3 block">🃏</span>
          </GlassCard>
        )}

        {/* Infinite-scroll sentinel */}
        <div ref={sentinelRef} className="flex justify-center py-6">
          {cards && visibleCount < cards.length && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              className="w-5 h-5 border-2 border-[#fc88c6]/60 border-t-transparent rounded-full"
            />
          )}
        </div>
      </div>

      {/* ── Card detail modal ── */}
      <CardDetailModal
        card={selectedCard}
        owned={selectedCard ? (isLoggedIn ? ownedIds.has(selectedCard._id) : false) : false}
        onClose={() => setSelectedCard(null)}
      />
    </LayoutGroup>
  );
}

