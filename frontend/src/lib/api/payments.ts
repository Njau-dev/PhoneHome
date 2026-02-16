import { apiClient } from "./client";
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface MpesaAddressPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  street: string;
  additionalInfo?: string;
}

export interface MpesaInitiateResponse {
  order_reference: string;
  checkout_request_id?: string;
}

export interface MpesaPaymentStatus {
  order_reference?: string;
  payment_method?: string;
  payment_status?: string;
  amount?: number;
  phone_number?: string;
  transaction_id?: string | null;
  mpesa_receipt?: string | null;
  failure_reason?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface MpesaInitiatePayload {
  phone_number: string;
  total_amount: number;
  address: MpesaAddressPayload;
}

interface MpesaRetryPayload {
  phone_number: string;
  order_reference: string;
}

const extractApiData = <T>(response: unknown): T | null => {
  if (response && typeof response === "object" && "data" in response) {
    return (response as ApiResponse<T>).data;
  }

  return response as T | null;
};

export const paymentsAPI = {
  initiateMpesaPayment: async (
    payload: MpesaInitiatePayload
  ): Promise<MpesaInitiateResponse> => {
    const response = await apiClient.post("/payments/mpesa/initiate", payload);
    const data = extractApiData<MpesaInitiateResponse>(response);
    if (!data) {
      throw new Error("Failed to initiate payment");
    }
    return data;
  },

  retryMpesaPayment: async (
    payload: MpesaRetryPayload
  ): Promise<MpesaInitiateResponse> => {
    const response = await apiClient.post("/payments/mpesa/retry", payload);
    const data = extractApiData<MpesaInitiateResponse>(response);
    if (!data) {
      throw new Error("Failed to retry payment");
    }
    return data;
  },

  getPaymentStatus: async (
    orderReference: string
  ): Promise<MpesaPaymentStatus> => {
    const response = await apiClient.get(
      `/payments/status/${orderReference}`
    );
    const data = extractApiData<MpesaPaymentStatus>(response);
    if (!data) {
      throw new Error("Failed to fetch payment status");
    }
    return data;
  },
};
