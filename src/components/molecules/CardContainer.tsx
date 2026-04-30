"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useTranslations } from "next-intl";
import RarityBadge from "@/components/atoms/RarityBadge";
import type { CardRarity } from "@/models/Card";
import { getCardImageUrl } from "@/lib/imagekit";

interface CardContainerProps {
  id: string;
  name: string;
  information: string;
  rarity: CardRarity;
  image: string;
  generation?: string;
  quantity?: number;
  /** undefined = no ownership info; false = blur as unowned */
  owned?: boolean;
  layoutId?: string;
  onClick?: () => void;
}

// SR / SSR / -H: image bleeds edge-to-edge, text overlays bottom
const FULL_ART_RARITIES: CardRarity[] = ["superRare", "epic", "legendary"];

const BLINK_STARS = [
  { x: "14%", y: "7%", sz: "9px", delay: "0s", dur: "1.4s" },
  { x: "76%", y: "11%", sz: "6px", delay: "0.4s", dur: "1.9s" },
  { x: "44%", y: "4%", sz: "11px", delay: "0.8s", dur: "1.6s" },
  { x: "89%", y: "32%", sz: "7px", delay: "1.2s", dur: "2.1s" },
  { x: "11%", y: "44%", sz: "6px", delay: "0.2s", dur: "1.7s" },
  { x: "63%", y: "26%", sz: "10px", delay: "0.6s", dur: "1.5s" },
  { x: "31%", y: "62%", sz: "7px", delay: "1.0s", dur: "2.0s" },
];

const CARD_BG: Record<string, string> = {
  common: "linear-gradient(160deg, #4b5563 0%, #9ca3af 45%, #374151 100%)",
  uncommon: "linear-gradient(160deg, #065f46 0%, #34d399 50%, #047857 100%)",
  rare: "linear-gradient(160deg, #1e3a8a 0%, #60a5fa 50%, #1d4ed8 100%)",
};

const OUTER_GLOW: Record<CardRarity, string> = {
  common: "shadow-lg",
  uncommon: "shadow-[0_0_18px_rgba(52,211,153,0.5)]",
  rare: "shadow-[0_0_28px_rgba(96,165,250,0.55)]",
  superRare: "shadow-[0_0_40px_rgba(168,85,247,0.65)]",
  epic: "shadow-[0_0_50px_rgba(251,191,36,0.7),0_0_90px_rgba(251,191,36,0.3)]",
  legendary:
    "shadow-[0_0_60px_rgba(252,136,198,0.75),0_0_120px_rgba(147,51,234,0.4)]",
};

export default function CardContainer({
  id,
  name,
  information,
  rarity,
  image,
  generation,
  quantity,
  owned,
  layoutId,
  onClick,
}: CardContainerProps) {
  const t = useTranslations("gallery.rarities");
  const cardRef = useRef<HTMLDivElement>(null);
  const fullArt = FULL_ART_RARITIES.includes(rarity);
  const [isHovered, setIsHovered] = useState(false);

  const motionX = useMotionValue(0);
  const motionY = useMotionValue(0);
  const rotateX = useSpring(useTransform(motionY, [-100, 100], [18, -18]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(motionX, [-100, 100], [-18, 18]), {
    stiffness: 300,
    damping: 30,
  });
  const holoX = useTransform(motionX, [-100, 100], [0, 100]);
  const holoY = useTransform(motionY, [-100, 100], [0, 100]);

  function handleMouseMove(e: React.MouseEvent) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    motionX.set(e.clientX - (rect.left + rect.width / 2));
    motionY.set(e.clientY - (rect.top + rect.height / 2));
  }
  function handleMouseLeave() {
    motionX.set(0);
    motionY.set(0);
    setIsHovered(false);
  }
  function handleMouseEnter() {
    setIsHovered(true);
  }

  return (
    <div className="relative w-full" style={{ perspective: isHovered ? '900px' : 'none' }}>
      {rarity === "legendary" && (
        <div
          className="absolute -inset-[2px] rounded-2xl z-0 animate-rainbow-spin"
          style={{
            background:
              "linear-gradient(270deg,#fc88c6,#a855f7,#3b82f6,#06b6d4,#22c55e,#eab308,#fc88c6)",
            backgroundSize: "300% 300%",
          }}
        />
      )}
      {rarity === "epic" && (
        <div
          className="absolute -inset-[2px] rounded-2xl z-0 animate-legendary-border"
          style={{
            background:
              "linear-gradient(135deg,#fbbf24,#f97316,#eab308,#fbbf24,#fde68a,#fbbf24)",
            backgroundSize: "300% 300%",
          }}
        />
      )}
      {rarity === "superRare" && (
        <div
          className="absolute -inset-[1.5px] rounded-2xl z-0 opacity-80 animate-pulse"
          style={{
            background:
              "linear-gradient(135deg,#a855f7,#ec4899,#8b5cf6,#a855f7)",
          }}
        />
      )}

      <motion.div
        ref={cardRef}
        layoutId={layoutId}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX: isHovered ? rotateX : 0, rotateY: isHovered ? rotateY : 0 }}
        whileHover={{ scale: 1.03 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className={`relative cursor-pointer group w-full rounded-2xl overflow-hidden z-10 ${OUTER_GLOW[rarity]}`}
      >
        {fullArt ? (
          /* Full-art: SR / SSR / HX */
          <div
            className="relative overflow-hidden"
            style={{ paddingBottom: "140%" }}
          >
            <img
              src={owned === false ? "/white.png" : getCardImageUrl(image)}
              alt={name}
              className="absolute inset-0 w-full h-full object-cover object-top"
            />

            <motion.div
              className="absolute inset-0 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: `radial-gradient(ellipse at ${holoX}% ${holoY}%, rgba(252,136,198,0.4) 0%, rgba(147,51,234,0.25) 40%, transparent 70%)`,
              }}
            />
            <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
              <div className="card-shimmer" />
            </div>
            <div className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="sparkle-overlay" />
            </div>

            {rarity === "legendary" && (
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
                      textShadow: "0 0 6px #fc88c6, 0 0 14px #a855f7",
                      color: "white",
                    }}
                  >
                    &#10022;
                  </span>
                ))}
              </div>
            )}

            {owned === false && (
              <div className="absolute inset-0 z-30 backdrop-blur-md bg-black/50 flex flex-col items-center justify-center gap-2">
                <span className="text-3xl">&#128274;</span>
                <span className="text-xs font-semibold text-white/80">
                  {t('notOwned')}
                </span>
              </div>
            )}

            <div className="absolute top-0 left-0 right-0 z-20 flex items-start justify-between p-2">
              {generation && (
                <span className="bg-black/60 text-white/90 text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm tracking-wide">
                  {generation}
                </span>
              )}
              {quantity !== undefined && quantity > 1 && (
                <span className="ml-auto bg-[#fc88c6]/90 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
                  &times;{quantity}
                </span>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 via-black/55 to-transparent pt-8 pb-2.5 px-3">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <h3
                  className={`font-extrabold text-sm truncate leading-tight ${
                    rarity === "legendary"
                      ? "rainbow-text"
                      : rarity === "epic"
                        ? "text-amber-300"
                        : "text-purple-200"
                  }`}
                >
                  {owned === false ? "???" : name}
                </h3>
                <RarityBadge rarity={rarity} label={t(rarity)} />
              </div>
              <p className="text-[10px] text-white/65 line-clamp-2 leading-relaxed">
                {owned === false ? "???" : information}
              </p>
            </div>
          </div>
        ) : (
          /* Standard card: common / uncommon / rare — fixed 5:7 aspect ratio matching full-art */
          <div
            className="relative overflow-hidden"
            style={{ paddingBottom: '140%', background: CARD_BG[rarity] ?? CARD_BG.common }}
          >
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-black/10 pointer-events-none z-10 rounded-2xl" />

            {/* Name + generation header */}
            <div className="absolute top-0 left-0 right-0 z-20 px-2.5 pt-2 pb-1 flex items-center justify-between gap-1">
              <h3 className="font-black text-sm text-white drop-shadow-md truncate leading-tight">
                {name}
              </h3>
              {generation && (
                <span className="text-[9px] font-extrabold text-white/70 shrink-0 tracking-wide">
                  {generation}
                </span>
              )}
            </div>

            {/* Art window — fills space between header and text box */}
            <div className="absolute left-2 right-2 z-20" style={{ top: '30px', bottom: '70px' }}>
              <div
                className="relative w-full h-full rounded-lg overflow-hidden"
                style={{ boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.55), 0 0 0 2px rgba(0,0,0,0.3)' }}
              >
                <img
                  src={getCardImageUrl(image)}
                  alt={name}
                  className="w-full h-full object-cover object-top"
                />
                {quantity !== undefined && quantity > 1 && (
                  <div className="absolute top-1.5 right-1.5 bg-[#fc88c6]/90 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
                    &times;{quantity}
                  </div>
                )}
              </div>
            </div>

            {/* Text + rarity — pinned to bottom */}
            <div className="absolute bottom-0 left-2 right-2 z-20 rounded-b-md overflow-hidden rounded-t-md">
              <div
                className="px-2.5 py-1.5 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.92)', height: '40px' }}
              >
                <p className="text-[9.5px] text-slate-700 line-clamp-2 leading-relaxed italic">
                  {information}
                </p>
              </div>
              <div
                className="px-2.5 py-1.5 flex items-center justify-between border-t border-slate-200/80 mb-2 rounded-b-md"
                style={{ background: 'rgba(255,255,255,0.85)', height: '30px' }}
              >
                <RarityBadge rarity={rarity} label={t(rarity)} />
              </div>
            </div>

            {/* Unowned overlay */}
            {owned === false && (
              <div className="absolute inset-0 z-30 backdrop-blur-md bg-black/50 flex flex-col items-center justify-center gap-2 rounded-2xl">
                <span className="text-3xl">&#128274;</span>
                <span className="text-xs font-semibold text-white/80">
                  Not owned
                </span>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
