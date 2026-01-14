// src/lib/store.ts
import { create } from 'zustand';

interface SlugState {
  slugs: Record<string, string> | null;
  setSlugs: (slugs: Record<string, string> | null) => void;
}

export const useSlugStore = create<SlugState>((set) => ({
  slugs: null,
  setSlugs: (slugs) => set({ slugs }),
}));
