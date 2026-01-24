import { create } from "zustand";

interface UIState {
  showSearch: boolean;
  searchQuery: string;
  isMobileMenuOpen: boolean;
  isCartDrawerOpen: boolean;

  // Actions
  toggleSearch: () => void;
  setSearchQuery: (query: string) => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleCartDrawer: () => void;
  closeCartDrawer: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  showSearch: false,
  searchQuery: "",
  isMobileMenuOpen: false,
  isCartDrawerOpen: false,

  toggleSearch: () => set((state) => ({ showSearch: !state.showSearch })),
  
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  
  toggleCartDrawer: () => set((state) => ({ isCartDrawerOpen: !state.isCartDrawerOpen })),
  
  closeCartDrawer: () => set({ isCartDrawerOpen: false }),
}));
