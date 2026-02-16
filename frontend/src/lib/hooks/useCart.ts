import { useCartStore } from "@/lib/stores/useCartStore";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { useEffect, useMemo } from "react";

export const useCart = () => {
  const items = useCartStore((state) => state.items);
  const variations = useCartStore((state) => state.variations);
  const isLoading = useCartStore((state) => state.isLoading);
  const isSyncing = useCartStore((state) => state.isSyncing);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const syncWithServer = useCartStore((state) => state.syncWithServer);
  const loadFromServer = useCartStore((state) => state.loadFromServer);
  const getItemsByProduct = useCartStore((state) => state.getItemsByProduct);
  const getCount = useCartStore((state) => state.getCount);
  const getTotal = useCartStore((state) => state.getTotal);
  const { token, isAuthenticated } = useAuthStore();
  const hasHydrated = true;

  // Sync with server when user logs in
  useEffect(() => {
    if (token && isAuthenticated) {
      syncWithServer(token);
    }
  }, [token, isAuthenticated, syncWithServer]);

  const count = useMemo(() => {
    let totalCount = 0;
    for (const productId in items) {
      for (const variationKey in items[productId]) {
        totalCount += items[productId][variationKey].quantity;
      }
    }
    return totalCount;
  }, [items]);

  const total = useMemo(() => {
    let totalPrice = 0;
    for (const productId in items) {
      for (const variationKey in items[productId]) {
        const item = items[productId][variationKey];
        totalPrice += item.price * item.quantity;
      }
    }
    return totalPrice;
  }, [items]);

  return {
    items,
    variations,
    isLoading,
    isSyncing,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    syncWithServer,
    loadFromServer,
    getItemsByProduct,
    getCount,
    getTotal,
    count,
    total,
    hasHydrated,
  };
};
