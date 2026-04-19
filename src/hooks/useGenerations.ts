'use client';

import { useQuery } from '@tanstack/react-query';

export interface GenerationData {
  _id: string;
  code: string;
  nameEn: string;
  nameJa: string;
  description: string;
  releaseDate: string;
}

export function useGenerations() {
  return useQuery<GenerationData[]>({
    queryKey: ['generations'],
    queryFn: async () => {
      const res = await fetch('/api/generations');
      if (!res.ok) throw new Error('Failed to load generations');
      return res.json();
    },
    staleTime: Infinity, // static data — stays fresh until page reload
  });
}
