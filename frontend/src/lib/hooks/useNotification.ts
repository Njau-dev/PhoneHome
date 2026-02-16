import { toast } from "sonner";
import { Product } from "@/lib/types/product";

export const useNotification = () => {
  const notifyCart = (message: string, product?: Product) => {
    toast.success(message, {
      description: product ? `${product.name}` : undefined,
      duration: 3000,
    });
  };

  const notifyWishlist = (message: string, product?: Product) => {
    toast.success(message, {
      description: product ? `${product.name}` : undefined,
      duration: 3000,
    });
  };

  const notifyCompare = (message: string, product?: Product) => {
    toast.info(message, {
      description: product ? `${product.name}` : undefined,
      duration: 3000,
    });
  };

  const notifyError = (message: string) => {
    toast.error(message, {
      duration: 4000,
    });
  };

  const notifySuccess = (message: string) => {
    toast.success(message, {
      duration: 3000,
    });
  };

  const notifyInfo = (message: string) => {
    toast.info(message, {
      duration: 3000,
    });
  };

  return {
    notifyCart,
    notifyWishlist,
    notifyCompare,
    notifyError,
    notifySuccess,
    notifyInfo,
  };
};
