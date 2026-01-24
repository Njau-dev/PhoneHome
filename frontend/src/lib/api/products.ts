import { apiClient } from "./client";
import { Product } from "@/lib/types/product";

interface ProductResponse {
  success: boolean;
  data: {
    product: Product;
  };
  message: string;
}

interface ProductsResponse {
  success: boolean;
  data: {
    products: Product[];
  };
  message: string;
}

export const productsAPI = {
  getAll: async (): Promise<Product[]> => {
    const response: ProductsResponse = await apiClient.get("/products");
    return response.data.products;
  },

  getById: async (id: number): Promise<Product> => {
    const response: ProductResponse = await apiClient.get(`/products/${id}`);
    return response.data.product;
  },

  getByCategory: async (category: string): Promise<Product[]> => {
    const response: ProductsResponse = await apiClient.get(`/products?category=${category}`);
    return response.data.products;
  },

  search: async (query: string): Promise<Product[]> => {
    const response: ProductsResponse = await apiClient.get(`/products/search?q=${query}`);
    return response.data.products;
  },

  getBestSellers: async (): Promise<Product[]> => {
    const response: ProductsResponse = await apiClient.get("/products?bestseller=true");
    return response.data.products;
  },
};
