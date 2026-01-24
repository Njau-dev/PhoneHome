import { create } from "zustand";
import { wishlistAPI, WishlistItem } from "@/lib/api/wishlist";
import { toast } from "sonner";

interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;

  // Actions
  addItem: (productId: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  syncWithServer: () => Promise<void>;
  clearWishlist: () => void;

  // Computed
  isInWishlist: (productId: number) => boolean;
  getCount: () => number;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  isLoading: false,

  addItem: async (productId: number) => {
    try {
      const response = await wishlistAPI.addItem(productId);
      
      // Refresh wishlist from server
      await get().syncWithServer();
      
      toast.success("Added to wishlist");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add to wishlist";
      toast.error(message);
      throw error;
    }
  },

  removeItem: async (productId: number) => {
    try {
      await wishlistAPI.removeItem(productId);
      
      // Remove from local state
      set((state) => ({
        items: state.items.filter((item) => item.id !== productId),
      }));
      
      toast.success("Removed from wishlist");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to remove from wishlist";
      toast.error(message);
      throw error;
    }
  },

  syncWithServer: async () => {
    set({ isLoading: true });
    try {
      const items = await wishlistAPI.getAll();
      set({ items, isLoading: false });
    } catch (error) {
      console.error("Failed to sync wishlist:", error);
      set({ isLoading: false });
    }
  },

  clearWishlist: () => {
    set({ items: [] });
  },

  isInWishlist: (productId: number) => {
    const { items } = get();
    return items.some((item) => item.id === productId);
  },

  getCount: () => {
    return get().items.length;
  },
}));
