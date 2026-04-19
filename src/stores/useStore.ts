import { create } from 'zustand';
import type { CardRarity } from '@/models/Card';

interface UserState {
  userId: string | null;
  email: string | null;
  displayName: string | null;
  sessionToken: string | null;
  minusEnergy: number;
  isLoggedIn: boolean;
}

interface UIState {
  activeRarityFilter: CardRarity | 'all';
  activeGenerationFilter: string;
  searchQuery: string;
  isMobileMenuOpen: boolean;
}

interface AppState extends UserState, UIState {
  // User actions
  setUser: (user: Partial<UserState>) => void;
  clearUser: () => void;
  addEnergy: (amount: number) => void;
  setEnergy: (amount: number) => void;
  // UI actions
  setRarityFilter: (rarity: CardRarity | 'all') => void;
  setGenerationFilter: (generation: string) => void;
  setSearchQuery: (query: string) => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

export const useStore = create<AppState>((set) => ({
  // User initial state
  userId: null,
  email: null,
  displayName: null,
  sessionToken: null,
  minusEnergy: 0,
  isLoggedIn: false,

  // UI initial state
  activeRarityFilter: 'all',
  activeGenerationFilter: 'all',
  searchQuery: '',
  isMobileMenuOpen: false,

  // User actions
  setUser: (user) =>
    set((state) => ({
      ...state,
      ...user,
      isLoggedIn: true,
    })),

  clearUser: () =>
    set({
      userId: null,
      email: null,
      displayName: null,
      sessionToken: null,
      minusEnergy: 0,
      isLoggedIn: false,
    }),

  addEnergy: (amount) =>
    set((state) => ({
      minusEnergy: state.minusEnergy + amount,
    })),

  setEnergy: (amount) => set({ minusEnergy: amount }),

  // UI actions
  setRarityFilter: (rarity) => set({ activeRarityFilter: rarity }),
  setGenerationFilter: (generation) => set({ activeGenerationFilter: generation }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
}));
