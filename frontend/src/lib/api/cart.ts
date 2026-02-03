import { apiClient } from "./client";
import { ProductVariation } from "@/lib/types/product";

export interface CartItemData {
  price: number;
  quantity: number;
}

export interface CartData {
  [productId: string]: {
    [variationKey: string]: CartItemData;
  };
}

interface CartResponse {
  success: boolean;
  data: {
    cart: CartData;
  };
  message: string;
}

interface AddToCartPayload {
  productId: number;
  quantity: number;
  selectedVariation?: ProductVariation;
}

export const cartAPI = {
  getCart: async (): Promise<CartData> => {
    try {
      const response: CartResponse = await apiClient.get("/cart");
      return response.data.cart;
    } catch (error) {
      // If unauthorized, return empty cart
      return {};
    }
  },

  addItem: async (payload: AddToCartPayload): Promise<CartResponse> => {
    return await apiClient.post("/cart", payload);
  },

  updateQuantity: async (
    productId: number,
    quantity: number,
    variationKey?: string
  ): Promise<CartResponse> => {
    return await apiClient.put('/cart', {
      productId,
      quantity,
      selectedVariation: variationKey !== "null" ? variationKey : null,
    });
  },

  removeItem: async (productId: number, variationKey?: string): Promise<CartResponse> => {
    return await apiClient.delete('/cart', {
      data: {
        productId,
        selectedVariation: variationKey !== "null" ? variationKey : null
      }
    });
  },

  clearCart: async (): Promise<{ success: boolean; message: string }> => {
    return await apiClient.delete("/cart/clear");
  },

  syncCart: async (localCart: CartData): Promise<CartResponse> => {
    return await apiClient.post("/cart/sync", { cart: localCart });
  },
};
