'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { useExplore } from '@/hooks/useExplore';
import { useDraw } from '@/hooks/useDraw';
import { useGenerations } from '@/hooks/useGenerations';
import { useStore } from '@/stores/useStore';
import GlassCard from '@/components/atoms/GlassCard';
import GlassButton from '@/components/atoms/GlassButton';
import PackOpenAnimation from '@/components/molecules/PackOpenAnimation';
import { Sparkles, Zap, Database, Layers } from 'lucide-react';

const MAX_DAILY_ATTEMPTS = 2;
const DRAW_COST = 10;
const PARTICLE_COLORS = ['#fc88c6', '#fbbf24', '#a855f7', '#06b6d4', '#f97316', '#34d399'];

interface Particle {
  id: number;
  angle: number;
  distance: number;
  color: string;
}

export default function DailyExploration() {
  const t = useTranslations('explore');
  const { userId, minusEnergy, addEnergy, setEnergy } = useStore();
  const exploreMutation = useExplore();
  const drawMutation = useDraw();
  const { data: generations } = useGenerations();

  // Server-synced attempts
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_DAILY_ATTEMPTS);
  const [attemptsLoaded, setAttemptsLoaded] = useState(false);

  // Draw generation selection
  const [selectedGeneration, setSelectedGeneration] = useState<string>('all');

  // Explore animation state
  const [lastFound, setLastFound] = useState<number | null>(null);
  const [exploreKey, setExploreKey] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Draw state
  const [drawnCards, setDrawnCards] = useState<import('@/hooks/useDraw').DrawnCard[]>([]);
  const [showPackAnimation, setShowPackAnimation] = useState(false);
  const [drawError, setDrawError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  // Load server-synced attempts on mount
  useEffect(() => {
    if (!userId) return;
    fetch(`/api/explore?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.attemptsLeft !== undefined) {
          setAttemptsLeft(data.attemptsLeft);
          setEnergy(data.totalEnergy ?? minusEnergy);
        }
      })
      .catch(() => { /* ignore — use defaults */ })
      .finally(() => setAttemptsLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  function spawnParticles() {
    const count = 12;
    const burst: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      angle: (360 / count) * i + Math.random() * 15,
      distance: 55 + Math.random() * 35,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    }));
    setParticles(burst);
    if (particleTimerRef.current) clearTimeout(particleTimerRef.current);
    particleTimerRef.current = setTimeout(() => setParticles([]), 900);
  }

  async function handleExplore() {
    if (!userId || attemptsLeft <= 0) return;
    setLastFound(null);
    spawnParticles();
    try {
      const result = await exploreMutation.mutateAsync({ userId });
      setLastFound(result.energyFound);
      setAttemptsLeft(result.attemptsLeft);
      addEnergy(result.energyFound);
      setExploreKey((k) => k + 1);
    } catch {
      // mutation error state handles feedback
    }
  }

  async function handleDraw(count: number = 1) {
    if (!userId) return;
    setDrawError(null);
    setDrawnCards([]);
    try {
      const result = await drawMutation.mutateAsync({
        userId,
        generation: selectedGeneration !== 'all' ? selectedGeneration : undefined,
        count,
      });
      setDrawnCards(result.cards);
      setShowPackAnimation(true);
      setEnergy(result.remainingEnergy);
    } catch (err) {
      setDrawError(err instanceof Error ? err.message : 'Draw failed');
    }
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      await fetch('/api/cards/seed', { method: 'POST' });
    } finally {
      setSeeding(false);
    }
  }

  const canDraw = minusEnergy >= DRAW_COST;
  const canDraw10 = minusEnergy >= DRAW_COST * 10;

  return (
    <>
      {/* ── Pack opening overlay ── */}
      <AnimatePresence>
        {showPackAnimation && drawnCards.length > 0 && (
          <PackOpenAnimation
            cards={drawnCards}
            onClose={() => setShowPackAnimation(false)}
          />
        )}
      </AnimatePresence>

      <div className="max-w-lg mx-auto space-y-6">
        {/* ── Daily Explore section ── */}
        <GlassCard hover={false} className="p-8 text-center relative overflow-visible">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">
            {t('title')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{t('subtitle')}</p>

          {/* Energy display */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Zap size={20} className="text-amber-400" />
            <span className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-[#fc88c6] bg-clip-text text-transparent">
              {minusEnergy}
            </span>
            <span className="text-sm text-slate-500 dark:text-slate-400">{t('energy')}</span>
          </div>

          {/* Explore button with particle burst */}
          <div className="relative">
            <motion.div
              key={exploreKey}
              initial={{ scale: 1 }}
              animate={lastFound !== null ? { scale: [1, 1.12, 1] } : {}}
              transition={{ duration: 0.35 }}
            >
              <GlassButton
                size="lg"
                variant="primary"
                onClick={handleExplore}
                disabled={attemptsLeft <= 0 || !userId || exploreMutation.isPending || !attemptsLoaded}
                className="w-full"
              >
                <Sparkles size={20} />
                {exploreMutation.isPending ? '...' : t('tap')}
              </GlassButton>
            </motion.div>

            {/* Particle burst — radiates from button center */}
            {particles.map((p) => {
              const rad = (p.angle * Math.PI) / 180;
              const tx = Math.cos(rad) * p.distance;
              const ty = Math.sin(rad) * p.distance;
              return (
                <motion.span
                  key={p.id}
                  initial={{ opacity: 1, x: 0, y: 0, scale: 1.2 }}
                  animate={{ opacity: 0, x: tx, y: ty, scale: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="absolute top-1/2 left-1/2 w-2.5 h-2.5 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"
                  style={{ backgroundColor: p.color }}
                />
              );
            })}

            {/* +XP float up */}
            <AnimatePresence>
              {lastFound !== null && (
                <motion.div
                  key={`xp-${exploreKey}`}
                  initial={{ opacity: 1, y: 0, scale: 1 }}
                  animate={{ opacity: 0, y: -75, scale: 1.6 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.4 }}
                  className="absolute inset-x-0 -top-2 text-center pointer-events-none"
                >
                  <span className="text-xl font-extrabold text-amber-400 drop-shadow-md">
                    +{lastFound} ⚡
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Attempts counter */}
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            {attemptsLeft > 0
              ? t('attemptsLeft', { count: attemptsLeft })
              : t('noAttemptsLeft')}
          </p>
        </GlassCard>

        {/* ── Draw Card section ── */}
        <GlassCard hover={false} className="p-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl">🎴</span>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {t('draw.title')}
            </h2>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('draw.subtitle')}</p>

          {/* Energy cost */}
          <div className="flex items-center justify-center gap-1.5">
            <Zap size={15} className="text-amber-400" />
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-300">
              {t('draw.cost')}
            </span>
          </div>

          {/* Generation selector */}
          {generations && generations.length > 0 && (
            <div className="space-y-3 mb-5">
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Layers size={12} />
                {t('draw.selectGeneration')}
              </div>
              {/* Horizontal scroll — newest generation first (leftmost) */}
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-2 px-2">
                {[...generations]
                  .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
                  .map((gen, idx) => {
                    const GRAD_PALETTE = [
                      'from-cyan-500 via-teal-400 to-emerald-500',
                      'from-emerald-500 via-green-400 to-teal-600',
                      'from-amber-500 via-orange-400 to-yellow-500',
                      'from-purple-600 via-fuchsia-500 to-pink-400',
                      'from-slate-500 via-gray-400 to-zinc-500',
                      'from-red-500 via-rose-400 to-pink-500',
                    ];
                    const grad = GRAD_PALETTE[idx % GRAD_PALETTE.length];
                    const isSelected = selectedGeneration === gen.code;
                    return (
                      <button
                        key={gen._id}
                        onClick={() => setSelectedGeneration(gen.code)}
                        className={`relative rounded-2xl overflow-hidden transition-all duration-200 text-left shrink-0 snap-start mt-5 ${isSelected ? 'w-40 h-36' : 'w-32 h-24'} ${
                          isSelected
                            ? 'ring-2 ring-[#fc88c6] ring-offset-2 ring-offset-transparent scale-[1.03]'
                            : 'hover:scale-[1.02] opacity-75 hover:opacity-100'
                        }`}
                        title={gen.nameJa}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${""}`} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/collections/cover/${gen.code}.jpg`}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover object-top opacity-40"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                        />
                        <div className="relative h-full flex flex-col justify-between p-3">
                          <span className="text-xl font-black text-white drop-shadow-lg leading-none">{gen.code}</span>
                          <div>
                            <p className="text-[13px] font-semibold text-white/90 leading-tight line-clamp-1">{gen.nameJa}</p>
                            {isSelected && gen.description && (
                              <p className="text-[9px] text-white/60 leading-tight line-clamp-2 mt-0.5">{gen.description}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {!canDraw && (
            <p className="text-xs text-[#d4509a] dark:text-[#fc88c6] font-medium mb-5">
              {t('draw.notEnoughEnergy')}
            </p>
          )}

          <GlassButton
            size="lg"
            variant="primary"
            onClick={() => handleDraw(1)}
            disabled={!canDraw || !userId || drawMutation.isPending}
            className="w-full mb-5"
          >
            {drawMutation.isPending
              ? <><span className="animate-spin inline-block mr-2">&#10022;</span>{t('draw.drawing')}</>
              : <>&#10024; {t('draw.button')}</>}
          </GlassButton>

          <GlassButton
            size="lg"
            variant="secondary"
            onClick={() => handleDraw(10)}
            disabled={!canDraw10 || !userId || drawMutation.isPending}
            className="w-full mb-5"
          >
            {drawMutation.isPending
              ? <><span className="animate-spin inline-block mr-2">&#10022;</span>{t('draw.drawing')}</>
              : <>&#127800; {t("gacha")} &#xD7;10 <span className="ml-1 text-xs opacity-70">(100 &#9889;)</span></>}
          </GlassButton>

          {drawError && (
            <p className="text-sm text-red-500 dark:text-red-400">{drawError}</p>
          )}

          {/* Admin: seed card database */}
          <div className="pt-2 border-t border-white/10">
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-1.5 mx-auto text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors disabled:opacity-50"
            >
              <Database size={12} />
              {seeding ? 'Seeding…' : t('draw.seedCards')}
            </button>
          </div>
        </GlassCard>
      </div>
    </>
  );
}
