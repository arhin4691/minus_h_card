'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ExploreResult {
  energyFound: number;
  attemptsLeft: number;
}

export function useExplore() {
  const queryClient = useQueryClient();

  return useMutation<ExploreResult, Error, { userId: string }>({
    mutationFn: async ({ userId }) => {
      const res = await fetch('/api/explore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error('Failed to explore');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}
