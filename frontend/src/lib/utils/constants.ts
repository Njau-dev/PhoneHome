export const APP_NAME = "Phone Home Kenya";
export const CURRENCY = "Kshs";
export const DELIVERY_FEE = 0;

export const PRODUCT_CATEGORIES = {
  PHONE: "phone",
  LAPTOP: "laptop",
  TABLET: "tablet",
  AUDIO: "audio",
} as const;

export const ORDER_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
} as const;

export const PAYMENT_METHODS = {
  MPESA: "mpesa",
  COD: "cod",
  CARD: "card",
} as const;

export const MAX_COMPARE_ITEMS = 3;

export const ITEMS_PER_PAGE = 12;

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: "token",
  USER: "user",
  CART: "guest_cart",
  COMPARE: "compare_items",
  AUTH: "auth_storage",
} as const;
