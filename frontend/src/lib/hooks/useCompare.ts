import { useCompareStore } from "@/lib/stores/useCompareStore";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { Product } from "@/lib/types/product";
import { useEffect, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { MAX_COMPARE_ITEMS } from "@/lib/utils/constants";

const subscribeToCompareHydration = (onStoreChange: () => void) => {
  const unsubscribeStore = useCompareStore.subscribe(() => {
    onStoreChange();
  });
  const unsubscribeHydrationStart = useCompareStore.persist.onHydrate(() => {
    onStoreChange();
  });
  const unsubscribeHydrationEnd = useCompareStore.persist.onFinishHydration(() => {
    onStoreChange();
  });

  return () => {
    unsubscribeStore();
    unsubscribeHydrationStart();
    unsubscribeHydrationEnd();
  };
};

export const useCompare = () => {
  const compare = useCompareStore();
  const { token, isAuthenticated } = useAuthStore();
  const hasHydrated = useSyncExternalStore(
    subscribeToCompareHydration,
    () => useCompareStore.persist.hasHydrated(),
    () => false
  );

  // Load from localStorage on mount
  useEffect(() => {
    compare.loadFromLocalStorage();
  }, []);

  // Sync with server when user is authenticated
  useEffect(() => {
    if (token && isAuthenticated) {
      compare.syncWithServer();
    }
  }, [token, isAuthenticated]);


  const addToCompare = async (product: Product) => {
    if (compare.items.length >= MAX_COMPARE_ITEMS) {
      toast.info(`Maximum of ${MAX_COMPARE_ITEMS} products can be compared at once`);
      return;
    }

    if (compare.isInCompare(product.id)) {
      toast.info("Product is already in comparison list");
      return;
    }

    await compare.addItem(product);
  };

  const removeFromCompare = async (productId: number) => {
    await compare.removeItem(productId);
  };

  const getCompareCount = () => compare.getCount();

  return {
    ...compare,
    hasHydrated,
    addToCompare,
    removeFromCompare,
    getCompareCount,
  };
};
