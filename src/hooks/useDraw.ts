'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/stores/useStore';
import type { CardRarity } from '@/models/Card';

export interface DrawnCard {
  _id: string;
  name: string;
  information: string;
  rarity: CardRarity;
  image: string;
}

interface DrawResult {
  card?: DrawnCard;
  cards: DrawnCard[];
  energySpent: number;
  remainingEnergy: number;
}

export function useDraw() {
  const queryClient = useQueryClient();
  const sessionToken = useStore((s) => s.sessionToken);

  return useMutation<DrawResult, Error, { userId: string; generation?: string; count?: number }>({
    mutationFn: async ({ userId, generation, count = 1 }) => {
      const res = await fetch('/api/cards/draw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, generation, count, sessionToken }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Draw failed');
      }
      const data = await res.json();
      // normalise: single draw API returns `card`, multi returns `cards`
      return { ...data, cards: data.cards ?? (data.card ? [data.card] : []) };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection'] });
    },
  });
}
