'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface FriendUser {
  _id: string;
  displayName: string;
  friendCode: string;
}

export interface FriendCardItem {
  _id: string;
  cardId: {
    _id: string;
    name: string;
    information: string;
    rarity: string;
    image: string;
  };
  quantity: number;
  isCrystalized: boolean;
}

export interface IncomingFriendRequest {
  _id: string;
  fromUserId: {
    _id: string;
    displayName: string;
    friendCode: string;
  };
  status: 'pending' | 'accepted' | 'denied';
  createdAt: string;
}

export function useFriends(userId: string | null) {
  return useQuery<FriendUser[]>({
    queryKey: ['friends', userId],
    queryFn: async () => {
      const res = await fetch(`/api/friends?userId=${userId}`);
      if (!res.ok) throw new Error('Failed to load friends');
      return res.json();
    },
    enabled: !!userId,
  });
}

export function useFriendRequests(userId: string | null) {
  return useQuery<IncomingFriendRequest[]>({
    queryKey: ['friendRequests', userId],
    queryFn: async () => {
      const res = await fetch(`/api/friends/requests?userId=${userId}`);
      if (!res.ok) throw new Error('Failed to load friend requests');
      return res.json();
    },
    enabled: !!userId,
    refetchInterval: 30_000,
  });
}

export function useFriendCollection(friendId: string | null, myUserId: string | null) {
  return useQuery<FriendCardItem[]>({
    queryKey: ['friendCollection', friendId, myUserId],
    queryFn: async () => {
      const res = await fetch(`/api/friends/${friendId}/cards?userId=${myUserId}`);
      if (!res.ok) throw new Error('Failed to load friend collection');
      return res.json();
    },
    enabled: !!friendId && !!myUserId,
  });
}

export function useAddFriend() {
  const queryClient = useQueryClient();
  return useMutation<
    { message: string; requestId: string },
    Error,
    { userId: string; friendCode: string }
  >({
    mutationFn: async ({ userId, friendCode }) => {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, friendCode }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to send friend request');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}

export function useRespondToFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation<
    { success: boolean; action: string },
    Error,
    { requestId: string; userId: string; action: 'accept' | 'deny' }
  >({
    mutationFn: async ({ requestId, userId, action }) => {
      const res = await fetch('/api/friends/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, userId, action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to respond to request');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
  });
}

export function useRemoveFriend() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { userId: string; friendId: string }>({
    mutationFn: async ({ userId, friendId }) => {
      const res = await fetch('/api/friends', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, friendId }),
      });
      if (!res.ok) throw new Error('Failed to remove friend');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}

