import { apiClient } from "./client";
import { Order } from "@/lib/types/order";

interface OrdersResponse {
  success: boolean;
  data: {
    orders: Order[];
  };
  message: string;
}

interface OrderResponse {
  success: boolean;
  data: {
    order: Order;
  };
  message: string;
}

export const ordersAPI = {
  getAll: async (): Promise<Order[]> => {
    const response: OrdersResponse = await apiClient.get("/orders");
    return response.data.orders;
  },

  getById: async (id: number): Promise<Order> => {
    const response: OrderResponse = await apiClient.get(`/orders/${id}`);
    return response.data.order;
  },

  create: async (orderData: any): Promise<Order> => {
    const response: OrderResponse = await apiClient.post("/orders", orderData);
    return response.data.order;
  },

  cancel: async (id: number): Promise<{ success: boolean; message: string }> => {
    return await apiClient.patch(`/orders/${id}/cancel`);
  },
};
