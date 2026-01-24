import { useCartStore } from "@/lib/stores/useCartStore";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { useEffect } from "react";

export const useCart = () => {
  const cart = useCartStore();
  const { token, isAuthenticated } = useAuthStore();

  // Sync with server when user logs in
  useEffect(() => {
    if (token && isAuthenticated) {
      cart.syncWithServer(token);
    }
  }, [token, isAuthenticated]);

  return cart;
};
