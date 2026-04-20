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

  // Draw generation selection — default to the newest generation on first load
  const [selectedGeneration, setSelectedGeneration] = useState<string>('all');
  const hasDefaultedGen = useRef(false);

  useEffect(() => {
    if (!hasDefaultedGen.current && generations && generations.length > 0) {
      const newest = [...generations].sort(
        (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
      )[0];
      setSelectedGeneration(newest.code);
      hasDefaultedGen.current = true;
    }
  }, [generations]);

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
                      /* ── Booster-pack shaped card ── */
                      <div
                        key={gen._id}
                        className="shrink-0 snap-start mt-5 p-5"
                        style={{ perspective: '700px' }}
                      >
                        <motion.button
                          onClick={() => setSelectedGeneration(gen.code)}
                          className="relative overflow-hidden cursor-pointer block"
                          style={{
                            width: isSelected ? '156px' : '130px',
                            height: isSelected ? '234px' : '195px',
                            borderRadius: '10px',
                            transformStyle: 'preserve-3d',
                            transformOrigin: 'center bottom',
                          }}
                          animate={isSelected
                            ? { rotateY: -10, rotateX: 3, y: -10, boxShadow: '8px 14px 35px rgba(252,136,198,0.45), 3px 6px 20px rgba(0,0,0,0.65)' }
                            : { rotateY: 0, rotateX: 0, y: 0, boxShadow: '4px 8px 22px rgba(0,0,0,0.45)' }
                          }
                          whileHover={!isSelected
                            ? { rotateY: -14, rotateX: 5, y: -8, boxShadow: '10px 18px 38px rgba(0,0,0,0.7)' }
                            : {}
                          }
                          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                          title={gen.nameJa}
                        >
                          {/* ── Gradient fallback (shows when image not loaded) ── */}
                          <div className={`absolute inset-0 bg-gradient-to-br ${""}`} />

                          {/* ── Pack artwork ── */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`${process.env.NEXT_PUBLIC_IMAGEKIT_URL}/collections/covers/${gen.code}.png?tr=w-200,h-300,fo-auto,pr-true,q-80`}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover object-top"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                          />

                          {/* ── Dark scrim for readability ── */}
                          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-black/80" />

                          {/* ── Top header band ── */}
                          <div className="absolute top-0 left-0 right-0 z-20 h-7 bg-black/60 flex items-center justify-center">
                            <span className="text-white/90 text-[7px] font-black tracking-[0.16em] uppercase select-none">
                              Minus H Card
                            </span>
                          </div>

                          {/* ── Perforation / tear line ── */}
                          <div
                            className="absolute left-1.5 right-1.5 z-20 pointer-events-none"
                            style={{ top: '27px', borderBottom: '1px dashed rgba(255,255,255,0.5)' }}
                          />
                          {/* Scissors at tear */}
                          <span
                            className="absolute z-20 pointer-events-none select-none text-white/40"
                            style={{ top: '20px', right: '5px', fontSize: '8px', lineHeight: 1 }}
                          >
                            ✂
                          </span>

                          {/* ── Holographic top-left sheen ── */}
                          <div
                            className="absolute inset-0 z-10 pointer-events-none"
                            style={{
                              background: 'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, transparent 45%)',
                            }}
                          />

                          {/* ── Animated rainbow sheen (selected only) ── */}
                          {isSelected && (
                            <motion.div
                              className="absolute inset-0 z-10 pointer-events-none"
                              // animate={{
                              //   background: [
                              //     'linear-gradient(120deg, rgba(252,136,198,0.3) 0%, transparent 45%, rgba(147,51,234,0.2) 90%)',
                              //     'linear-gradient(120deg, rgba(96,165,250,0.2) 0%, rgba(252,136,198,0.25) 50%, transparent 100%)',
                              //     'linear-gradient(120deg, rgba(147,51,234,0.2) 0%, transparent 55%, rgba(252,136,198,0.3) 100%)',
                              //   ],
                              // }}
                              transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                            />
                          )}

                          {/* ── Left-edge highlight (3D depth) ── */}
                          <div
                            // className="absolute top-0 left-0 bottom-0 z-20 pointer-events-none"
                            style={{
                              width: '6px',
                              borderRadius: '10px 0 0 10px',
                              background: 'linear-gradient(to right, rgba(255,255,255,0.28), transparent)',
                            }}
                          />

                          {/* ── Bottom info band ── */}
                          <div className="absolute bottom-0 left-0 right-0 z-20 px-2.5 pb-2.5 pt-8 bg-gradient-to-t from-black via-black/60 to-transparent">
                            <p className="text-white font-black text-[11px] leading-tight tracking-wide drop-shadow">{gen.code}</p>
                            <p className="text-white/65 text-[16px] leading-tight line-clamp-1 mt-0.5">{gen.nameJa}</p>
                            {isSelected && gen.description && (
                              <p className="text-white/45 text-[7px] leading-tight line-clamp-1 mt-0.5">{gen.description}</p>
                            )}
                          </div>

                          {/* ── Selection inset glow ring ── */}
                          {isSelected && (
                            <div
                              className="absolute inset-0 z-30 pointer-events-none"
                              style={{
                                borderRadius: '10px',
                                boxShadow: 'inset 0 0 0 2px rgba(252,136,198,0.9), inset 0 0 14px rgba(252,136,198,0.2)',
                              }}
                            />
                          )}
                        </motion.button>
                      </div>
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
