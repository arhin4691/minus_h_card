"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scissors, X, ChevronLeft, ChevronRight, LayoutGrid, Play } from "lucide-react";
import CardContainer from "@/components/molecules/CardContainer";
import type { CardRarity } from "@/models/Card";
import { useTranslations } from "next-intl";
import Image from "next/image";

interface PackCard {
  _id: string;
  name: string;
  information: string;
  rarity: CardRarity;
  image: string;
  isNew?: boolean;
}

interface PackOpenAnimationProps {
  cards: PackCard[];
  onClose: () => void;
}

const RARITY_FLASH: Record<CardRarity, string> = {
  common:    'rgba(148,163,184,0.5)',
  uncommon:  'rgba(52,211,153,0.5)',
  rare:      'rgba(96,165,250,0.6)',
  superRare: 'rgba(168,85,247,0.7)',
  epic:      'rgba(251,191,36,0.8)',
  legendary: 'rgba(252,136,198,0.9)',
};

const PARTICLE_COLORS = ['#fc88c6', '#fbbf24', '#a855f7', '#06b6d4', '#f97316', '#34d399'];

const RARITY_PACK_GRADIENT: Record<CardRarity, string> = {
  common: "from-slate-400 via-slate-500 to-slate-600",
  uncommon: "from-emerald-400 via-teal-500 to-emerald-600",
  rare: "from-blue-400 via-cyan-400 to-blue-600",
  superRare: "from-purple-500 via-fuchsia-500 to-purple-700",
  epic: "from-amber-400 via-orange-400 to-amber-600",
  legendary: "from-[#fc88c6] via-purple-500 to-blue-500",
};

// Stage: 0=cutting, 1=opening, 2=fan-spread (multi only), 3=individual reveal, 4=summary grid
type Stage = 0 | 1 | 2 | 3 | 4;

export default function PackOpenAnimation({ cards, onClose }: PackOpenAnimationProps) {
  const t = useTranslations('explore');
  const multi = cards.length > 1;

  const [stage, setStage] = useState<Stage>(0);
  const [revealedIndex, setRevealedIndex] = useState(0);
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const [isNewFlash, setIsNewFlash] = useState(false);
  const [seenSet, setSeenSet] = useState<Set<number>>(new Set());
  const burstKey = useRef(0);

  const allSeen = seenSet.size >= cards.length;

  const highestRarity = cards.reduce<CardRarity>((best, c) => {
    const order: CardRarity[] = ['common', 'uncommon', 'rare', 'superRare', 'epic', 'legendary'];
    return order.indexOf(c.rarity) > order.indexOf(best) ? c.rarity : best;
  }, 'common');
  const packGradient = RARITY_PACK_GRADIENT[highestRarity];

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 1400);
    const t2 = setTimeout(() => setStage(multi ? 2 : 3), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [multi]);

  const triggerReveal = useCallback((idx: number, rarity: CardRarity, isNew?: boolean) => {
    setRevealedIndex(idx);
    setSeenSet((prev) => new Set([...prev, idx]));
    if (isNew) {
      setIsNewFlash(true);
      setFlashColor('rgba(252,136,198,0.95)');
      burstKey.current += 1;
      setTimeout(() => { setFlashColor(null); setIsNewFlash(false); }, 600);
    } else {
      setIsNewFlash(false);
      setFlashColor(RARITY_FLASH[rarity]);
      burstKey.current += 1;
      setTimeout(() => setFlashColor(null), 300);
    }
  }, []);

  useEffect(() => {
    if (stage === 3 && multi) triggerReveal(0, cards[0].rarity, cards[0].isNew);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  function goNext() {
    if (revealedIndex < cards.length - 1) triggerReveal(revealedIndex + 1, cards[revealedIndex + 1].rarity, cards[revealedIndex + 1].isNew);
  }
  function goPrev() {
    if (revealedIndex > 0) triggerReveal(revealedIndex - 1, cards[revealedIndex - 1].rarity, cards[revealedIndex - 1].isNew);
  }

  function viewAll() {
    setSeenSet(new Set(cards.map((_, i) => i)));
    setStage(4);
  }

  const currentCard = cards[revealedIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex items-center justify-center overflow-hidden"
    >
      {/* Full-screen flash on reveal */}
      <AnimatePresence>
        {flashColor && (
          <motion.div
            key="flash"
            initial={{ opacity: isNewFlash ? 1 : 0.85 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: isNewFlash ? 0.6 : 0.3 }}
            className="absolute inset-0 z-50 pointer-events-none"
            style={{ background: flashColor }}
          >
            {/* Extra shimmer sweep for "New!" cards */}
            {isNewFlash && (
              <motion.div
                initial={{ x: '-100%', skewX: -20 }}
                animate={{ x: '200%' }}
                transition={{ duration: 0.55, ease: 'easeIn' }}
                className="absolute inset-y-0 w-1/2 bg-white/60 blur-sm"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stage 0 & 1: The Pack ── */}
      <AnimatePresence mode="wait">
        {stage < 2 && (
          <motion.div
            key="pack-wrapper"
            initial={{ scale: 0.7, opacity: 0, y: 30 }}
            animate={
              stage === 1
                ? { scale: [1, 1.07, 0.96, 1.05, 1], rotateZ: [0, -5, 5, -2, 0], opacity: 1, y: 0 }
                : { scale: 1, opacity: 1, y: 0 }
            }
            exit={{ scale: 1.6, opacity: 0, y: -100, rotateZ: 15 }}
            transition={{ duration: stage === 1 ? 0.7 : 0.45, ease: "backOut" }}
            className="flex flex-col items-center gap-4"
          >
            <div className="relative w-44 h-60 rounded-2xl overflow-hidden shadow-2xl">
              <div className={`absolute inset-0 bg-gradient-to-br ${packGradient}`} />
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
              {stage === 1 && (
                <motion.div
                  initial={{ x: "-100%", skewX: -20 }}
                  animate={{ x: "200%" }}
                  transition={{ duration: 0.55, ease: "easeIn" }}
                  className="absolute inset-y-0 w-1/3 bg-white/40 blur-sm"
                />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/80">
                <Image src="/title/title.png" alt="Minus H" width={56} height={42}
                  className="object-contain drop-shadow-[0_0_6px_rgba(252,136,198,0.5)]" priority />
                <span className="text-xs font-bold tracking-widest uppercase opacity-70">Minus H</span>
              </div>
              {stage === 0 && (
                <div className="absolute top-14 left-0 right-0 pointer-events-none">
                  <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                    transition={{ duration: 1, delay: 0.4, ease: "easeIn" }}
                    style={{ originX: 0 }} className="h-px w-full border-t-2 border-dashed border-white/70" />
                  <motion.div initial={{ left: "0%" }} animate={{ left: "92%" }}
                    transition={{ duration: 1, delay: 0.4, ease: "easeIn" }} className="absolute -top-3">
                    <Scissors size={14} className="text-white drop-shadow" />
                  </motion.div>
                </div>
              )}
              {stage === 1 && (
                <motion.div initial={{ y: 0, rotate: 0, opacity: 1 }}
                  animate={{ y: -160, rotate: -22, opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={`absolute top-0 left-0 right-0 h-14 bg-gradient-to-br ${packGradient} rounded-t-2xl z-10`} />
              )}
            </div>
            <p className="text-sm text-white/60 animate-pulse">
              {stage === 0 ? t('pack.cutting') : t('pack.opening')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stage 2: Fan spread (multi only) ── */}
      <AnimatePresence>
        {stage === 2 && multi && (
          <motion.div key="fan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-6">
            <div className="relative h-52 w-72 flex items-center justify-center">
              {cards.map((c, i) => {
                const spread = Math.min(cards.length * 14, 120);
                const angle = -spread / 2 + (i / (cards.length - 1)) * spread;
                return (
                  <motion.div key={i}
                    initial={{ rotate: 0, y: 60, opacity: 0 }}
                    animate={{ rotate: angle, y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.06, type: "spring", stiffness: 200, damping: 20 }}
                    className="absolute origin-bottom" style={{ zIndex: i }}>
                    <div className={`w-20 h-28 rounded-xl shadow-lg bg-gradient-to-br ${RARITY_PACK_GRADIENT[c.rarity]} flex items-center justify-center`}>
                      <span className="text-white/70 text-xs font-bold">{i + 1}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="text-white/70 text-sm font-medium">
              {t('pack.cardsDrawn', { count: cards.length })}
            </motion.p>
            <div className="flex gap-3">
              <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
                onClick={() => setStage(3)}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#fc88c6] to-purple-500 text-white font-bold text-sm shadow-lg hover:opacity-90 active:scale-95 transition-all">
                <Play size={14} /> {t('pack.oneByOne')}
              </motion.button>
              <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
                onClick={viewAll}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-sm border border-white/20 active:scale-95 transition-all">
                <LayoutGrid size={14} /> {t('pack.viewAll')}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stage 3: Individual card reveal ── */}
      <AnimatePresence>
        {stage === 3 && (
          <motion.div key="card-reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 px-4 w-full max-w-xs">
            {/* Burst ring */}
            <motion.div key={`ring-${burstKey.current}`}
              initial={{ scale: 0.3, opacity: 0.9 }} animate={{ scale: 2.8, opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute w-64 h-64 rounded-full border-2 border-[#fc88c6]/60 pointer-events-none" />
            {/* Sparkle burst */}
            {Array.from({ length: 12 }, (_, i) => {
              const rad = ((360 / 12) * i * Math.PI) / 180;
              return (
                <motion.span key={`sp-${burstKey.current}-${i}`}
                  initial={{ opacity: 1, x: 0, y: 0, scale: 1.4 }}
                  animate={{ opacity: 0, x: Math.cos(rad) * 130, y: Math.sin(rad) * 130, scale: 0 }}
                  transition={{ duration: 0.9, delay: 0.05 * i, ease: "easeOut" }}
                  className="absolute pointer-events-none select-none font-bold"
                  style={{ color: PARTICLE_COLORS[i % PARTICLE_COLORS.length], top: "35%", left: "50%" }}>
                  ✦
                </motion.span>
              );
            })}
            {/* Card with flip-in */}
            <AnimatePresence mode="wait">
              <motion.div key={`card-${currentCard._id}-${revealedIndex}`}
                initial={{ rotateY: 90, opacity: 0, scale: 0.85 }}
                animate={{ rotateY: 0, opacity: 1, scale: 1 }}
                exit={{ rotateY: -90, opacity: 0, scale: 0.85 }}
                transition={{ type: "spring", stiffness: 240, damping: 22 }}
                style={{ perspective: "900px" }} className="w-full relative">
                <CardContainer id={currentCard._id} name={currentCard.name}
                  information={currentCard.information} rarity={currentCard.rarity}
                  image={currentCard.image} owned />
                {/* "New" badge */}
                {currentCard.isNew && (
                  <motion.div
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{ scale: 1, rotate: -12 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.15 }}
                    className="absolute -top-3 -right-2 z-20 px-2.5 py-1 rounded-full text-[11px] font-black tracking-wider text-white shadow-lg pointer-events-none"
                    style={{ background: 'linear-gradient(135deg, #fc88c6, #a855f7)' }}
                  >
                    NEW ✦
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
            {/* Nav dots */}
            {multi && (
              <div className="flex items-center gap-3">
                <button onClick={goPrev} disabled={revealedIndex === 0}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/60 disabled:opacity-30 transition-all">
                  <ChevronLeft size={18} />
                </button>
                <div className="flex gap-1.5">
                  {cards.map((c, i) => (
                    <button key={i} onClick={() => triggerReveal(i, c.rarity, c.isNew)}
                      className={`rounded-full transition-all ${
                        i === revealedIndex
                          ? 'w-2.5 h-2.5 bg-[#fc88c6] scale-125'
                          : seenSet.has(i)
                            ? 'w-2 h-2 bg-white/70'
                            : 'w-2 h-2 bg-white/25'
                      }`} />
                  ))}
                </div>
                <button onClick={goNext} disabled={revealedIndex === cards.length - 1}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/60 disabled:opacity-30 transition-all">
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
            {multi && (
              <p className="text-xs text-white/40">{seenSet.size} / {cards.length} seen</p>
            )}
            {/* Single card: collect button appears immediately */}
            {!multi && (
              <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                onClick={onClose}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-[#fc88c6] to-purple-500 text-white font-bold text-sm shadow-lg hover:opacity-90 active:scale-95 transition-all">
                ✨ {t("draw.addedToCollection")}
              </motion.button>
            )}
            {/* Multi: show summary CTA once all seen, or skip link before */}
            {multi && (
              <div className="flex flex-col items-center gap-2">
                <AnimatePresence mode="wait">
                  {allSeen ? (
                    <motion.button
                      key="summary-btn"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setStage(4)}
                      className="px-8 py-3 rounded-2xl bg-gradient-to-r from-[#fc88c6] to-purple-500 text-white font-bold text-sm shadow-lg hover:opacity-90 active:scale-95 transition-all">
                      {t('pack.viewSummary')}
                    </motion.button>
                  ) : (
                    <motion.button
                      key="skip-all-btn"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={viewAll}
                      className="text-xs text-white/40 hover:text-white/70 underline transition-colors py-1">
                      {t('pack.skipViewAll')}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stage 4: Summary grid ── */}
      <AnimatePresence>
        {stage === 4 && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col items-center gap-4 w-full max-w-5xl px-4"
            style={{ maxHeight: '90vh' }}
          >
            <p className="text-white font-bold shrink-0 text-base">
              {t('pack.summaryTitle', { count: cards.length })} ✦{' '}
              <span className="text-[#fc88c6] font-normal text-sm">
                {cards.filter((c) => ['superRare', 'epic', 'legendary'].includes(c.rarity)).length > 0
                  ? t('pack.rarePlus', { count: cards.filter((c) => ['superRare', 'epic', 'legendary'].includes(c.rarity)).length })
                  : t('pack.allCollected')}
              </span>
            </p>
            <div
              className="w-full overflow-y-auto"
              style={{ maxHeight: 'calc(90vh - 130px)' }}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-2">
                {cards.map((c, i) => (
                  <div key={i} className="w-full relative">
                    <CardContainer
                      id={c._id}
                      name={c.name}
                      information={c.information}
                      rarity={c.rarity}
                      image={c.image}
                      owned
                    />
                    {c.isNew && (
                      <div
                        className="absolute -top-2 -right-1 z-20 px-2 py-0.5 rounded-full text-[10px] font-black text-white pointer-events-none"
                        style={{ background: 'linear-gradient(135deg, #fc88c6, #a855f7)' }}
                      >
                        NEW
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={onClose}
              className="shrink-0 px-8 py-3 rounded-2xl bg-gradient-to-r from-[#fc88c6] to-purple-500 text-white font-bold text-sm shadow-lg hover:opacity-90 active:scale-95 transition-all"
            >
              ✨ {t('draw.addedToCollection')}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip */}
      <button onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/60 transition-colors"
        aria-label="Skip">
        <X size={16} />
      </button>
    </motion.div>
  );
}
