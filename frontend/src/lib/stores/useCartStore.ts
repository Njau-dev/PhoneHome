import { create } from "zustand";
import { persist } from "zustand/middleware";
import { cartAPI, CartData, CartItemData } from "@/lib/api/cart";
import { ProductVariation } from "@/lib/types/product";
import { STORAGE_KEYS } from "@/lib/utils/constants";
import { toast } from "sonner";

interface CartState {
  items: CartData;
  isLoading: boolean;
  isSyncing: boolean;
  variations: { [key: string]: ProductVariation };

  // Actions
  addItem: (productId: number, variation?: ProductVariation, quantity?: number) => Promise<void>;
  removeItem: (productId: number, variationKey?: string) => Promise<void>;
  updateQuantity: (productId: number, quantity: number, variationKey?: string) => Promise<void>;
  clearCart: () => void;
  syncWithServer: (token: string) => Promise<void>;
  loadFromServer: () => Promise<void>;

  // Computed
  getCount: () => number;
  getTotal: () => number;
  getItemsByProduct: (productId: number) => { [variationKey: string]: CartItemData } | null;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: {},
      isLoading: false,
      isSyncing: false,
      variations: {},

      addItem: async (productId, variation, quantity = 1) => {
        const { items } = get();
        const newItems = { ...items };
        const productIdStr = productId.toString();
        
        // Determine variation key
        const variationKey = variation 
          ? `${variation.ram} - ${variation.storage}` 
          : "null";
        
        // Initialize product if not exists
        if (!newItems[productIdStr]) {
          newItems[productIdStr] = {};
        }
        
        // Initialize variation if not exists
        if (!newItems[productIdStr][variationKey]) {
          newItems[productIdStr][variationKey] = {
            quantity: 0,
            price: variation?.price || 0,
          };
        }
        
        // Update quantity
        newItems[productIdStr][variationKey].quantity += quantity;
        
        // Update local state immediately for optimistic UI
        const newVariations = { ...get().variations };
        if (variation) {
          newVariations[variationKey] = variation;
        }
        set({ items: newItems, variations: newVariations });
        
        // Sync with server if user is logged in
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        if (token) {
          try {
            await cartAPI.addItem({
              productId,
              quantity,
              selectedVariation: variation,
            });
          } catch (error) {
            console.error("Failed to sync cart with server:", error);
            toast.error("Failed to update cart on server");
            // Rollback on error
            set({ items, variations: get().variations });
          }
        }
        
        toast.success("Added to cart");
      },

      removeItem: async (productId, variationKey = "null") => {
        const { items } = get();
        const newItems = { ...items };
        const productIdStr = productId.toString();
        
        if (newItems[productIdStr]) {
          delete newItems[productIdStr][variationKey];
          
          // Remove product entry if no variations left
          if (Object.keys(newItems[productIdStr]).length === 0) {
            delete newItems[productIdStr];
          }
        }
        
        set({ items: newItems });
        
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        if (token) {
          try {
            await cartAPI.removeItem(productId, variationKey);
          } catch (error) {
            console.error("Failed to remove from server cart:", error);
            // Rollback on error
            set({ items });
          }
        }
        
        toast.success("Removed from cart");
      },

      updateQuantity: async (productId, quantity, variationKey = "null") => {
        const { items } = get();
        const productIdStr = productId.toString();
        
        if (quantity <= 0) {
          get().removeItem(productId, variationKey);
          return;
        }
        
        const newItems = { ...items };
        
        if (newItems[productIdStr]?.[variationKey]) {
          newItems[productIdStr][variationKey].quantity = quantity;
          set({ items: newItems });
          
          const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
          if (token) {
            try {
              await cartAPI.updateQuantity(productId, quantity, variationKey);
            } catch (error) {
              console.error("Failed to update quantity on server:", error);
              // Rollback on error
              set({ items });
            }
          }
        }
      },

      clearCart: () => {
        set({ items: {} });
        
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        if (token) {
          cartAPI.clearCart().catch(console.error);
        }
      },

      syncWithServer: async (token: string) => {
        set({ isSyncing: true });
        try {
          const { items, variations } = get();
          
          // If user has local cart items, sync them to server
          if (Object.keys(items).length > 0) {
            // Send each item to server
            for (const productId in items) {
              for (const variationKey in items[productId]) {
                const item = items[productId][variationKey];
                const variation = variations[variationKey];
                
                await cartAPI.addItem({
                  productId: parseInt(productId),
                  quantity: item.quantity,
                  selectedVariation: variation,
                });
              }
            }
          }
          
          // Then fetch the complete cart from server
          const serverCart = await cartAPI.getCart();
          set({ items: serverCart, isSyncing: false });
          
        } catch (error) {
          console.error("Failed to sync cart:", error);
          set({ isSyncing: false });
        }
      },

      loadFromServer: async () => {
        set({ isLoading: true });
        try {
          const serverCart = await cartAPI.getCart();
          set({ items: serverCart, isLoading: false });
        } catch (error) {
          console.error("Failed to load cart:", error);
          set({ isLoading: false });
        }
      },

      getCount: () => {
        const { items } = get();
        let count = 0;
        
        for (const productId in items) {
          for (const variationKey in items[productId]) {
            count += items[productId][variationKey].quantity;
          }
        }
        
        return count;
      },

      getTotal: () => {
        const { items } = get();
        let total = 0;
        
        for (const productId in items) {
          for (const variationKey in items[productId]) {
            const item = items[productId][variationKey];
            total += item.price * item.quantity;
          }
        }
        
        return total;
      },

      getItemsByProduct: (productId: number) => {
        const { items } = get();
        return items[productId.toString()] || null;
      },
    }),
    {
      name: STORAGE_KEYS.CART,
      partialize: (state) => ({ items: state.items, variations: state.variations }),
    }
  )
);
