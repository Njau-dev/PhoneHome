import { useAuthStore } from "@/lib/stores/useAuthStore";
import { useCartStore } from "@/lib/stores/useCartStore";
import { useWishlistStore } from "@/lib/stores/useWishlistStore";
import { useCompareStore } from "@/lib/stores/useCompareStore";
import { useRouter } from "next/navigation";

export const useAuth = () => {
  const auth = useAuthStore();
  const cart = useCartStore();
  const wishlist = useWishlistStore();
  const compare = useCompareStore();
  const router = useRouter();

  const login = async (email: string, password: string) => {
    try {
      await auth.login(email, password);

      // Sync cart, wishlist and compare after login (guest cart to user cart)
      if (auth.token) {
        await cart.syncWithServer(auth.token);
      }

      await wishlist.syncWithServer();
      await compare.syncWithServer();

      router.push("/");
      return true;
    } catch {
      return false;
    }
  };

  const signup = async (
    username: string,
    email: string,
    password: string,
    phone_number?: string
  ) => {
    try {
      await auth.signup(username, email, password, phone_number);

      // Sync cart after signup
      if (auth.token) {
        await cart.syncWithServer(auth.token);
      }

      router.push("/");
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try {
      await auth.logout();

      // Clear all stores
      cart.clearCart();
      wishlist.clearWishlist();
      compare.clearCompare();

      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return {
    ...auth,
    login,
    signup,
    logout,
  };
};
