import { useWishlistStore } from "@/lib/stores/useWishlistStore";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const useWishlist = () => {
  const wishlist = useWishlistStore();
  const syncWithServer = useWishlistStore((state) => state.syncWithServer);
  const { isAuthenticated, token } = useAuthStore();
  const router = useRouter();

  // Sync with server when user is authenticated
  useEffect(() => {
    if (token && isAuthenticated) {
      syncWithServer();
    }
  }, [token, isAuthenticated, syncWithServer]);

  const addToWishlist = async (productId: number) => {
    if (!isAuthenticated) {
      toast.info("Please login to add items to wishlist");
      router.push("/login");
      return;
    }

    await wishlist.addItem(productId);
  };

  const removeFromWishlist = async (productId: number) => {
    await wishlist.removeItem(productId);
  };

  return {
    ...wishlist,
    addToWishlist,
    removeFromWishlist,
  };
};
