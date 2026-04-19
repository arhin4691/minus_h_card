'use client';

import type { CardRarity } from '@/models/Card';

interface RarityBadgeProps {
  rarity: CardRarity;
  label: string;
}

const rarityStyles: Record<CardRarity, string> = {
  common:
    'bg-slate-300/30 text-slate-600 dark:text-slate-300 border-slate-300/40',
  uncommon:
    'bg-green-300/30 text-green-700 dark:text-green-300 border-green-300/40',
  rare:
    'bg-blue-300/30 text-blue-700 dark:text-blue-300 border-blue-300/40',
  superRare:
    'bg-purple-300/30 text-purple-700 dark:text-purple-300 border-purple-300/40',
  epic:
    'bg-amber-300/30 text-amber-700 dark:text-amber-200 border-amber-300/40 shadow-[0_0_12px_rgba(251,191,36,0.3)]',
  legendary:
    'bg-gradient-to-r from-pink-300/40 via-purple-300/40 to-blue-300/40 text-pink-700 dark:text-pink-200 border-pink-300/50 shadow-[0_0_18px_rgba(236,72,153,0.4)]',
};

export default function RarityBadge({ rarity, label }: RarityBadgeProps) {
  const style = rarityStyles[rarity] ?? rarityStyles.common;
  return (
    <span
      className={`
        inline-flex items-center
        px-2.5 py-0.5
        text-xs font-semibold
        rounded-full
        border
        backdrop-blur-sm
        ${style}
      `}
    >
      {rarity === 'legendary' && <span className="mr-1">✦</span>}
      {rarity === 'epic' && <span className="mr-1">★</span>}
      {label}
    </span>
  );
}



