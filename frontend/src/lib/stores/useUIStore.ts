import { create } from "zustand";

interface UIState {
  isCartDrawerOpen: boolean;

  // Actions
  toggleCartDrawer: () => void;
  closeCartDrawer: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isCartDrawerOpen: false,

  toggleCartDrawer: () => set((state) => ({ isCartDrawerOpen: !state.isCartDrawerOpen })),

  closeCartDrawer: () => set({ isCartDrawerOpen: false }),
}));
