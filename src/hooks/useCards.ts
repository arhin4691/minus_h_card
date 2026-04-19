'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CardRarity } from '@/models/Card';

interface CardData {
  _id: string;
  name: string;
  information: string;
  rarity: CardRarity;
  image: string;
  generation: string;
}

interface CollectionItem {
  _id: string;
  cardId: CardData;
  quantity: number;
  isCrystalized: boolean;
}

export function useCards(rarity?: CardRarity | 'all', search?: string, generation?: string) {
  return useQuery<CardData[]>({
    queryKey: ['cards', rarity, search, generation],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (rarity && rarity !== 'all') params.set('rarity', rarity);
      if (search) params.set('search', search);
      if (generation && generation !== 'all') params.set('generation', generation);
      const res = await fetch(`/api/cards?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch cards');
      return res.json();
    },
  });
}

export function useCollection(userId: string | null) {
  return useQuery<CollectionItem[]>({
    queryKey: ['collection', userId],
    queryFn: async () => {
      const res = await fetch(`/api/collection?userId=${userId}`);
      if (!res.ok) throw new Error('Failed to fetch collection');
      return res.json();
    },
    enabled: !!userId,
  });
}

export function useGiftCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      fromUserId: string;
      toFriendId: string;
      cardId: string;
    }) => {
      const res = await fetch('/api/social/gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to gift card');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection'] });
    },
  });
}
