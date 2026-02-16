import { apiClient } from "./client";

export interface WishlistItem {
  id: number;
  brand: string;
  category: string;
  image_url: string;
  name: string;
  price: number;
}

interface WishlistResponse {
  success: boolean;
  data: {
    wishlist: WishlistItem[];
  };
  message: string;
}

export const wishlistAPI = {
  getAll: async (): Promise<WishlistItem[]> => {
    const response: WishlistResponse = await apiClient.get("/wishlist");
    return response.data.wishlist;
  },

  addItem: async (productId: number): Promise<WishlistResponse> => {
    return await apiClient.post("/wishlist", { product_id: productId });
  },

  removeItem: async (productId: number): Promise<{ success: boolean; message: string }> => {
    return await apiClient.delete(`/wishlist/${productId}`);
  },
};
