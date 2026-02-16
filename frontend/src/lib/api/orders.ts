import { apiClient } from "./client";
import { Order } from "@/lib/types/order";
import { paymentsAPI } from "./payments";

const extractOrders = (response: unknown): Order[] => {
  if (response && typeof response === "object") {
    const dataOrders = (response as { data?: { orders?: Order[] } }).data?.orders;
    if (Array.isArray(dataOrders)) {
      return dataOrders;
    }

    const orders = (response as { orders?: Order[] }).orders;
    if (Array.isArray(orders)) {
      return orders;
    }
  }

  return [];
};

const extractOrder = (response: unknown): Order | null => {
  if (response && typeof response === "object") {
    const dataOrder = (response as { data?: { order?: Order } }).data?.order;
    if (dataOrder) {
      return dataOrder;
    }

    const dataAsOrder = (response as { data?: Order }).data;
    if (dataAsOrder && typeof dataAsOrder === "object") {
      return dataAsOrder;
    }

    const order = (response as { order?: Order }).order;
    if (order) {
      return order;
    }
  }

  return null;
};

export const ordersAPI = {
  getAll: async (): Promise<Order[]> => {
    const response = await apiClient.get("/orders");
    const orders = extractOrders(response);
    return orders;
  },

  getById: async (id: number | string): Promise<Order> => {
    const response = await apiClient.get(`/orders/${id}`);
    const order = extractOrder(response);
    if (!order) {
      throw new Error("Order not found");
    }
    return order;
  },

  create: async (orderData: Record<string, unknown>): Promise<Order> => {
    const response = await apiClient.post("/orders", orderData);
    const order = extractOrder(response);
    if (!order) {
      throw new Error("Failed to create order");
    }
    return order;
  },

  cancel: async (id: number): Promise<{ success: boolean; message: string }> => {
    return await apiClient.patch(`/orders/${id}/cancel`);
  },

  getPaymentStatus: async (id: number | string): Promise<string> => {
    const statusData = await paymentsAPI.getPaymentStatus(String(id));
    return statusData.payment_status || "Unknown";
  },

  downloadPaymentDocument: async (
    id: number | string,
    docType: string
  ): Promise<Blob> => {
    const response = await apiClient.get<Blob>(
      `/orders/document/${id}/${docType.toLowerCase()}`,
      {
        responseType: "blob" as const,
      }
    );

    return response as unknown as Blob;
  },
};
