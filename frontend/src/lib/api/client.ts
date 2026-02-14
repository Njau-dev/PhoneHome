import axios, { AxiosInstance, AxiosError } from "axios";
import { STORAGE_KEYS } from "@/lib/utils/constants";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

let hasShownSessionExpiredToast = false;

const clearClientAuth = () => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.AUTH);

  void import("@/lib/stores/useAuthStore")
    .then((module) => {
      module.useAuthStore.getState().clearAuth();
    })
    .catch(() => {
      // Best-effort: storage cleanup already happened above.
    });

  void import("@/lib/stores/useCartStore")
    .then((module) => {
      module.useCartStore.getState().clearCart();
    })
    .catch(() => {
      // Best-effort: ignore store cleanup failures.
    });

  void import("@/lib/stores/useWishlistStore")
    .then((module) => {
      module.useWishlistStore.getState().clearWishlist();
    })
    .catch(() => {
      // Best-effort: ignore store cleanup failures.
    });

  void import("@/lib/stores/useCompareStore")
    .then((module) => {
      void module.useCompareStore.getState().clearCompare();
    })
    .catch(() => {
      // Best-effort: ignore store cleanup failures.
    });
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response.data, // Return only the data portion
  (error: AxiosError<{ error?: string; message?: string }>) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        clearClientAuth();
        if (!hasShownSessionExpiredToast) {
          hasShownSessionExpiredToast = true;
          toast.error("Session expired. Please log in again.");
        }
        window.location.href = "/login";
      }
    }

    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.error ||
      "An error occurred";

    return Promise.reject(new Error(errorMessage));
  }
);

export default apiClient;
