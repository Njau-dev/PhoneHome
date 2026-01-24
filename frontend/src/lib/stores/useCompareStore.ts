import { create } from "zustand";
import { persist } from "zustand/middleware";
import { compareAPI } from "@/lib/api/compare";
import { Product } from "@/lib/types/product";
import { STORAGE_KEYS, MAX_COMPARE_ITEMS } from "@/lib/utils/constants";
import { toast } from "sonner";

interface CompareState {
  items: Product[];
  productIds: number[];
  isLoading: boolean;

  // Actions
  addItem: (product: Product) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  clearCompare: () => Promise<void>;
  syncWithServer: () => Promise<void>;
  loadFromLocalStorage: () => void;

  // Computed
  isInCompare: (productId: number) => boolean;
  getCount: () => number;
  canAddMore: () => boolean;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      productIds: [],
      isLoading: false,

      addItem: async (product: Product) => {
        const { items, productIds } = get();
        
        // Check if already in compare
        if (productIds.includes(product.id)) {
          toast.info("Product is already in comparison list");
          return;
        }
        
        // Check max limit
        if (items.length >= MAX_COMPARE_ITEMS) {
          toast.info(`Maximum of ${MAX_COMPARE_ITEMS} products can be compared at once`);
          return;
        }
        
        // Update local state immediately
        const newItems = [...items, product];
        const newProductIds = [...productIds, product.id];
        
        set({ items: newItems, productIds: newProductIds });
        
        // Sync with server if user is logged in
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        if (token) {
          try {
            await compareAPI.addItem(product.id);
          } catch (error) {
            console.error("Failed to add to server compare:", error);
            // Rollback on error
            set({ items, productIds });
            toast.error("Failed to add product to comparison");
            return;
          }
        }
        
        toast.success(`Compare count: ${newItems.length}/${MAX_COMPARE_ITEMS}`);
      },

      removeItem: async (productId: number) => {
        const { items, productIds } = get();
        
        const newItems = items.filter((item) => item.id !== productId);
        const newProductIds = productIds.filter((id) => id !== productId);
        
        set({ items: newItems, productIds: newProductIds });
        
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        if (token) {
          try {
            await compareAPI.removeItem(productId);
          } catch (error) {
            console.error("Failed to remove from server compare:", error);
            // Rollback on error
            set({ items, productIds });
          }
        }
        
        toast.success("Removed from comparison");
      },

      clearCompare: async () => {
        set({ items: [], productIds: [] });
        
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        if (token) {
          try {
            await compareAPI.clear();
          } catch (error) {
            console.error("Failed to clear server compare:", error);
          }
        }
        
        toast.success("Comparison cleared");
      },

      syncWithServer: async () => {
        set({ isLoading: true });
        try {
          const productIds = await compareAPI.getAll();
          set({ productIds, isLoading: false });
          
          // Note: We'll need to fetch full product details separately
          // This will be handled in the useCompare hook
        } catch (error) {
          console.error("Failed to sync compare:", error);
          set({ isLoading: false });
        }
      },

      loadFromLocalStorage: () => {
        // This is handled by persist middleware
        // Just a placeholder for manual loading if needed
      },

      isInCompare: (productId: number) => {
        return get().productIds.includes(productId);
      },

      getCount: () => {
        return get().items.length;
      },

      canAddMore: () => {
        return get().items.length < MAX_COMPARE_ITEMS;
      },
    }),
    {
      name: STORAGE_KEYS.COMPARE,
      partialize: (state) => ({
        items: state.items,
        productIds: state.productIds,
      }),
    }
  )
);
