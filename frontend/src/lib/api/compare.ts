import { apiClient } from "./client";

interface CompareResponse {
  success: boolean;
  data: {
    product_ids: number[];
  };
  message: string;
}

export const compareAPI = {
  getAll: async (): Promise<number[]> => {
    try {
      const response: CompareResponse = await apiClient.get("/compare");
      return response.data.product_ids;
    } catch {
      return [];
    }
  },

  addItem: async (productId: number): Promise<CompareResponse> => {
    return await apiClient.post("/compare", { product_id: productId });
  },

  removeItem: async (productId: number): Promise<{ success: boolean; message: string }> => {
    return await apiClient.delete(`/compare/${productId}`);
  },

  clear: async (): Promise<{ success: boolean; message: string }> => {
    return await apiClient.delete("/compare/clear");
  },
};
