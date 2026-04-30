"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { X, Layers } from "lucide-react";
import RarityBadge from "@/components/atoms/RarityBadge";
import type { CardRarity } from "@/models/Card";
import { useTranslations } from "next-intl";
import { getCardImageUrl } from "@/lib/imagekit";
import { useGenerations } from "@/hooks/useGenerations";

interface ModalCard {
  _id: string;
  name: string;
  information: string;
  rarity: CardRarity;
  image: string;
  generation?: string;
}

interface CardDetailModalProps {
  card: ModalCard | null;
  owned?: boolean;
  onClose: () => void;
  /** When true, renders the card directly without backdrop/portal */
  inline?: boolean;
}

const FULL_ART_RARITIES: CardRarity[] = ["superRare", "epic", "legendary"];

const BLINK_STARS = [
  { x: "14%", y: "7%", sz: "10px", delay: "0s", dur: "1.4s" },
  { x: "76%", y: "11%", sz: "7px", delay: "0.4s", dur: "1.9s" },
  { x: "44%", y: "4%", sz: "12px", delay: "0.8s", dur: "1.6s" },
  { x: "89%", y: "32%", sz: "8px", delay: "1.2s", dur: "2.1s" },
  { x: "11%", y: "44%", sz: "7px", delay: "0.2s", dur: "1.7s" },
  { x: "63%", y: "26%", sz: "11px", delay: "0.6s", dur: "1.5s" },
];

const CARD_BG: Record<string, string> = {
  common: "linear-gradient(160deg, #4b5563 0%, #9ca3af 45%, #374151 100%)",
  uncommon: "linear-gradient(160deg, #065f46 0%, #34d399 50%, #047857 100%)",
  rare: "linear-gradient(160deg, #1e3a8a 0%, #60a5fa 50%, #1d4ed8 100%)",
};

const RARITY_GLOW: Record<CardRarity, string> = {
  common: "",
  uncommon: "shadow-[0_0_40px_rgba(52,211,153,0.4)]",
  rare: "shadow-[0_0_50px_rgba(96,165,250,0.5)]",
  superRare: "shadow-[0_0_60px_rgba(168,85,247,0.6)]",
  epic: "shadow-[0_0_80px_rgba(251,191,36,0.7),0_0_160px_rgba(251,191,36,0.3)]",
  legendary:
    "shadow-[0_0_80px_rgba(252,136,198,0.7),0_0_160px_rgba(147,51,234,0.4)]",
};

export default function CardDetailModal({
  card,
  owned,
  onClose,
  inline = false,
}: CardDetailModalProps) {
  const t = useTranslations("gallery");
  const { data: generations } = useGenerations();
  const genInfo = generations?.find((g) => g.code === card?.generation);

  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), {
    stiffness: 280,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-12, 12]), {
    stiffness: 280,
    damping: 30,
  });
  const holoX = useTransform(mouseX, [-0.5, 0.5], [0, 100]);
  const holoY = useTransform(mouseY, [-0.5, 0.5], [0, 100]);
  const holoBackground = useTransform(
    [holoX, holoY],
    ([x, y]: number[]) =>
      `radial-gradient(ellipse at ${x}% ${y}%, rgba(252,136,198,0.45) 0%, rgba(147,51,234,0.28) 40%, transparent 70%)`,
  );
  const holoOpacity = useTransform(mouseX, [-0.5, 0, 0.5], [1, 0, 1]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    const { left, top, width, height } =
      cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - left) / width - 0.5);
    mouseY.set((e.clientY - top) / height - 0.5);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  const [mounted, setMounted] = useState(false);
  const [showClose, setShowClose] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Restore close button visibility when a new card is opened
  useEffect(() => {
    if (card) setShowClose(true);
  }, [card]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock body scroll while the modal is open
  useEffect(() => {
    if (!card) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [card]);

  const modal = (
    <AnimatePresence>
      {card && (
        <>
          {/* Backdrop */}
          <motion.div
            key="modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-md"
          />

          <div className="fixed inset-0 z-[61] flex flex-col items-center justify-center pointer-events-none p-6 gap-4">
            <div
              className="pointer-events-auto"
              style={{ perspective: "900px", width: "100%", maxWidth: "384px" }}
            >
              <motion.div
                ref={cardRef}
                key={card._id}
                initial={{ scale: 0.88, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.88, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ rotateX, rotateY }}
                className={`
                relative pointer-events-auto
                w-full rounded-2xl overflow-hidden
                ${RARITY_GLOW[card.rarity] ?? ""}
              `}
              >
                {FULL_ART_RARITIES.includes(card.rarity) ? (
                  /* Full-art modal: photo fills whole card, text overlaid */
                  <div
                    className="relative overflow-hidden rounded-2xl"
                    style={{ paddingBottom: '140%' }}
                  >
                    {/* Full-bleed photo */}
                    <img
                      src={
                        owned === false
                          ? "/white.png"
                          : getCardImageUrl(card.image)
                      }
                      alt={card.name}
                      className="absolute inset-0 w-full h-full object-cover object-top z-0"
                    />

                    {/* Holographic tilt overlay */}
                    <motion.div
                      className="absolute inset-0 z-10 pointer-events-none"
                      style={{
                        background: holoBackground,
                        opacity: holoOpacity,
                      }}
                    />

                    {/* Shimmer */}
                    <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                      <div className="card-shimmer" />
                    </div>

                    {/* Blink stars for legendary */}
                    {card.rarity === "legendary" && (
                      <div className="absolute inset-0 z-20 pointer-events-none">
                        {BLINK_STARS.map((s, i) => (
                          <span
                            key={i}
                            className="absolute select-none"
                            style={{
                              left: s.x,
                              top: s.y,
                              fontSize: s.sz,
                              animation: `blink-star ${s.dur} ease-in-out ${s.delay} infinite`,
                              textShadow: "0 0 8px #fc88c6, 0 0 16px #a855f7",
                              color: "white",
                            }}
                          >
                            &#10022;
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Top gradient: name + generation */}
                    <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent px-5 pt-4 pb-14">
                      <div className="flex items-start justify-between gap-2">
                        <h2
                          className={`text-xl font-black leading-tight drop-shadow-lg ${
                            card.rarity === "legendary"
                              ? "rainbow-text"
                              : card.rarity === "epic"
                                ? "text-amber-300"
                                : "text-purple-200"
                          }`}
                        >
                          {owned === false ? "???" : card.name}
                        </h2>
                        {card.generation && (
                          <span className="text-xs font-extrabold text-white/60 shrink-0 tracking-widest mt-1">
                            {card.generation}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom gradient: info + gen details + rarity */}
                    <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-5 pt-16 pb-4 space-y-2">
                      <p
                        className="text-sm text-white/80 leading-relaxed"
                        style={{
                          minHeight: "40px",
                          maxHeight: "40px",
                          overflow: "auto",
                        }}
                      >
                        {owned === false ? "???" : card.information}
                      </p>
                      {card.generation && (
                        <div className="flex items-start gap-2 pt-1 border-t border-white/10">
                          <Layers
                            size={13}
                            className="text-slate-400 mt-0.5 shrink-0"
                          />
                          <div>
                            <span className="text-xs font-bold text-[#fc88c6]">
                              {card.generation}
                            </span>
                            {genInfo && (
                              <span className="text-xs text-slate-300 ml-1.5">
                                &#8212; {genInfo.nameEn}
                              </span>
                            )}
                            {/* {genInfo?.description && (
                              <p
                                className="text-[11px] text-slate-400 mt-0.5 leading-snug"
                                style={{
                                  minHeight: "10px",
                                  maxHeight: "10px",
                                  overflow: "auto",
                                }}
                              >
                                {genInfo.description}
                              </p>
                            )} */}
                          </div>
                        </div>
                      )}
                      <RarityBadge
                        rarity={card.rarity}
                        label={t(`rarities.${card.rarity}`)}
                      />
                    </div>

                    {/* Unowned overlay */}
                    {owned === false && (
                      <div className="absolute inset-0 z-30 backdrop-blur-md bg-black/50 flex flex-col items-center justify-center gap-3 rounded-2xl">
                        <span className="text-5xl">&#128274;</span>
                        <span className="text-sm font-semibold text-white/80">
                          Not owned
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Standard modal: common / uncommon / rare */
                  <div
                    style={{
                      background: CARD_BG[card.rarity] ?? CARD_BG.common,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/10 pointer-events-none z-10 rounded-2xl" />

                    {/* Name header */}
                    <div className="relative z-20 px-5 pt-4 pb-2 flex items-center justify-between gap-2">
                      <h2 className="text-xl font-black text-white drop-shadow-lg leading-tight truncate">
                        {owned === false ? "???" : card.name}
                      </h2>
                      {card.generation && (
                        <span className="text-xs font-extrabold text-white/60 shrink-0 tracking-widest">
                          {card.generation}
                        </span>
                      )}
                    </div>

                    {/* Art window */}
                    <div className="relative z-20 px-4 pb-2">
                      <div
                        className="relative w-full overflow-hidden rounded-xl"
                        style={{
                          boxShadow:
                            "inset 0 3px 10px rgba(0,0,0,0.6), 0 0 0 2px rgba(0,0,0,0.35)",
                          aspectRatio: "4/4",
                        }}
                      >
                        <img
                          src={
                            owned === false
                              ? "/white.png"
                              : getCardImageUrl(card.image)
                          }
                          alt={card.name}
                          className="w-full h-full object-cover object-top"
                        />
                        {owned === false && (
                          <div className="absolute inset-0 backdrop-blur-md bg-black/40 flex flex-col items-center justify-center gap-2">
                            <span className="text-4xl">&#128274;</span>
                            <span className="text-sm font-semibold text-white/80">
                              Not owned
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Text box */}
                    <div className="relative z-20 mx-4 mb-0 rounded-t-lg overflow-hidden">
                      <div
                        className="px-4 py-3"
                        style={{
                          background: "rgba(255,255,255,0.93)",
                          minHeight: "60px",
                          maxHeight: "60px",
                          overflowY: "auto",
                        }}
                      >
                        <p className="text-sm text-slate-700 leading-relaxed italic">
                          {owned === false ? "???" : card.information}
                        </p>
                      </div>

                      {card.generation && (
                        <div
                          className="px-4 py-2 border-t border-slate-200/80 flex items-start gap-2"
                          style={{ background: "rgba(255,255,255,0.88)" }}
                        >
                          <Layers
                            size={13}
                            className="text-slate-400 mt-0.5 shrink-0"
                          />
                          <div
                            style={{
                              minHeight: "20px",
                              maxHeight: "20px",
                              overflow: "auto",
                            }}
                          >
                            <span className="text-xs font-bold text-[#d4509a]">
                              {card.generation}
                            </span>
                            {genInfo && (
                              <span className="text-xs text-slate-500 ml-1.5">
                                &#8212; {genInfo.nameEn}
                              </span>
                            )}
                            {genInfo?.description && (
                              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                                {genInfo.description}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      <div
                        className="px-4 py-2 border-t border-slate-200/80 flex items-center justify-between rounded-b-xl"
                        style={{ background: "rgba(255,255,255,0.85)" }}
                      >
                        <RarityBadge
                          rarity={card.rarity}
                          label={t(`rarities.${card.rarity}`)}
                        />
                      </div>
                    </div>
                    <div className="relative z-20 h-4 mx-4 rounded-b-lg" />
                  </div>
                )}
              </motion.div>
            </div>

            {/* Close button — below the card, exits immediately on click via its own AnimatePresence */}
            <AnimatePresence>
              {showClose && (
                <motion.button
                  key="close-btn"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4, transition: { duration: 0.08 } }}
                  transition={{ delay: 0.15 }}
                  onClick={() => {
                    setShowClose(false);
                    onClose();
                  }}
                  className="pointer-events-auto flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 dark:bg-white/10 dark:hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white/80 hover:text-white text-sm font-medium transition-all"
                >
                  <X size={15} />
                  Close
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return mounted ? createPortal(modal, document.body) : null;
}
