'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useCollection } from '@/hooks/useCards';
import { useStore } from '@/stores/useStore';
import GlassCard from '@/components/atoms/GlassCard';
import GlassButton from '@/components/atoms/GlassButton';
import CardContainer from '@/components/molecules/CardContainer';
import CardDetailModal from '@/components/molecules/CardDetailModal';
import { Trophy, Star, ArrowUpDown } from 'lucide-react';
import { motion, LayoutGroup } from 'framer-motion';
import type { CardRarity } from '@/models/Card';

const RARITY_ORDER: Record<CardRarity, number> = {
  common: 1, uncommon: 2, rare: 3, superRare: 4, epic: 5, legendary: 6,
};

type SortKey = 'default' | 'name' | 'rarity' | 'quantity';

const PAGE_SIZE = 15;

interface ModalCard {
  _id: string;
  name: string;
  information: string;
  rarity: CardRarity;
  image: string;
  generation?: string;
}

export default function CollectionMilestones() {
  const t = useTranslations('collection');
  const { userId } = useStore();
  const { data: collection } = useCollection(userId);
  const [selectedCard, setSelectedCard] = useState<ModalCard | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('default');
  const [sortAsc, setSortAsc] = useState(true);

  // Infinite scroll
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset pagination whenever sort changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [sortKey, sortAsc]);

  // Observe sentinel to load next batch
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

  const totalCards = collection?.reduce((sum, c) => sum + c.quantity, 0) ?? 0;
  const uniqueCards = collection?.length ?? 0;
  const crystalizedCount = collection?.filter((c) => c.isCrystalized).length ?? 0;

  const sorted = useMemo(() => {
    if (!collection) return [];
    const arr = [...collection];
    arr.sort((a, b) => {
      let diff = 0;
      if (sortKey === 'name') {
        diff = a.cardId.name.localeCompare(b.cardId.name);
      } else if (sortKey === 'rarity') {
        diff = (RARITY_ORDER[a.cardId.rarity] ?? 0) - (RARITY_ORDER[b.cardId.rarity] ?? 0);
      } else if (sortKey === 'quantity') {
        diff = a.quantity - b.quantity;
      }
      return sortAsc ? diff : -diff;
    });
    return arr;
  }, [collection, sortKey, sortAsc]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(true); }
  }

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'default', label: t('sort.default') },
    { key: 'name',    label: t('sort.name') },
    { key: 'rarity',  label: t('sort.rarity') },
    { key: 'quantity',label: t('sort.quantity') },
  ];

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <GlassCard hover={false} className="p-3 sm:p-5 text-center">
          <div className="text-3xl sm:text-5xl font-bold text-[#d4509a] dark:text-[#fc88c6]">{totalCards}</div>
          <div className="text-[10px] sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-tight">{t('totalCards')}</div>
        </GlassCard>
        <GlassCard hover={false} className="p-3 sm:p-5 text-center">
          <div className="text-3xl sm:text-5xl font-bold text-purple-500">{uniqueCards}</div>
          <div className="text-[10px] sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-tight">{t('uniqueCards')}</div>
        </GlassCard>
        <GlassCard hover={false} glow={crystalizedCount > 0} className="p-3 sm:p-5 text-center">
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            <Trophy size={16} className="text-amber-400 sm:hidden" />
            <Trophy size={20} className="text-amber-400 hidden sm:block" />
            <span className="text-3xl sm:text-5xl font-bold text-amber-500">{crystalizedCount}</span>
          </div>
          <div className="text-[10px] sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-tight">{t('crystalUnlocked')}</div>
        </GlassCard>
      </div>

      {/* Sort controls */}
      {collection && collection.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <ArrowUpDown size={14} className="text-slate-400" />
          {SORT_OPTIONS.map(({ key, label }) => (
            <GlassButton
              key={key}
              size="sm"
              variant={sortKey === key ? 'primary' : 'ghost'}
              onClick={() => handleSort(key)}
            >
              {label}
              {sortKey === key && <span className="ml-1 text-xs">{sortAsc ? '↑' : '↓'}</span>}
            </GlassButton>
          ))}
        </div>
      )}

      {/* Collection grid */}
      {sorted.length > 0 ? (
        <LayoutGroup>
          <CardDetailModal
            card={selectedCard}
            owned={true}
            onClose={() => setSelectedCard(null)}
          />
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 justify-items-center"
          >
            {sorted.slice(0, visibleCount).map((item) => (
              <motion.div
                key={item._id}
                variants={{ hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } }}
                className="relative w-full"
              >
                {item.isCrystalized && (
                  <div className="absolute -top-2 -right-2 z-30">
                    <Star size={20} className="text-amber-400 fill-amber-400" />
                  </div>
                )}
                <CardContainer
                  id={item.cardId._id}
                  name={item.cardId.name}
                  information={item.cardId.information}
                  rarity={item.cardId.rarity}
                  image={item.cardId.image}
                  generation={item.cardId.generation || undefined}
                  quantity={item.quantity}
                  owned={true}
                  layoutId={`card-zoom-${item.cardId._id}`}
                  onClick={() =>
                    setSelectedCard({
                      _id: item.cardId._id,
                      name: item.cardId.name,
                      information: item.cardId.information,
                      rarity: item.cardId.rarity,
                      image: item.cardId.image,
                      generation: item.cardId.generation || undefined,
                    })
                  }
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Infinite-scroll sentinel */}
          <div ref={sentinelRef} className="flex justify-center py-6">
            {visibleCount < sorted.length && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                className="w-5 h-5 border-2 border-[#fc88c6]/60 border-t-transparent rounded-full"
              />
            )}
          </div>
        </LayoutGroup>
      ) : (
        <GlassCard hover={false} className="p-12 text-center">
          <span className="text-4xl mb-3 block">📦</span>
          <p className="text-slate-500 dark:text-slate-400">{t('empty')}</p>
        </GlassCard>
      )}
    </div>
  );
}
