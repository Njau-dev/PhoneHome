import { useState } from "react";
import { useRouter } from "next/navigation";
import { ordersAPI } from "@/lib/api/orders";
import { paymentsAPI } from "@/lib/api/payments";
import { useCartStore } from "@/lib/stores/useCartStore";
import { toast } from "sonner";

export interface PaymentFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  street: string;
  additionalInfo?: string;
}

type PaymentMethod = "COD" | "MPESA" | "PAYPAL" | "CARD";

export const usePayment = () => {
  const router = useRouter();
  const { getTotal, clearCart } = useCartStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const normalizePhoneNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("254")) {
      return digits;
    }
    if (digits.startsWith("0")) {
      return `254${digits.slice(1)}`;
    }
    if (digits.length === 9) {
      return `254${digits}`;
    }
    return digits;
  };

  const isValidKenyanNumber = (phone: string) =>
    phone.length === 12 && phone.startsWith("254");

  const validateFormData = (formData: PaymentFormData): boolean => {
    const requiredFields: (keyof PaymentFormData)[] = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "city",
      "street",
    ];

    const missingFields = requiredFields.filter((field) => !formData[field]);

    if (missingFields.length > 0) {
      toast.error("Please fill in all required fields");
      return false;
    }

    return true;
  };

  const createOrder = async (
    formData: PaymentFormData,
    paymentMethod: PaymentMethod,
    deliveryFee: number
  ) => {
    if (!validateFormData(formData)) {
      return null;
    }

    setIsProcessing(true);

    try {
      const orderData = {
        total_amount: getTotal() + deliveryFee,
        address: formData,
        payment_method: paymentMethod,
      };

      const order = await ordersAPI.create(orderData);
      
      if (paymentMethod === "COD") {
        toast.success("Order placed successfully!");
        clearCart();
        router.push("/orders");
      }

      return order;
    } catch (error) {
      console.error("Order creation error:", error);
      toast.error("Failed to place order. Please try again.");
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const initiateMpesaPayment = async (
    phoneNumber: string,
    formData: PaymentFormData,
    totalAmount: number
  ) => {
    if (!validateFormData(formData)) {
      return null;
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    if (!normalizedPhone || !isValidKenyanNumber(normalizedPhone)) {
      toast.error("Please enter a valid Kenyan phone number");
      return null;
    }

    setIsProcessing(true);

    try {
      const payload = {
        phone_number: normalizedPhone,
        total_amount: totalAmount,
        address: formData,
      };

      return await paymentsAPI.initiateMpesaPayment(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to initiate payment";
      toast.error(message);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const retryMpesaPayment = async (phoneNumber: string, orderReference: string) => {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    if (!normalizedPhone || !isValidKenyanNumber(normalizedPhone)) {
      toast.error("Please enter a valid Kenyan phone number");
      return null;
    }

    if (!orderReference) {
      toast.error("Order reference is required to retry payment");
      return null;
    }

    setIsProcessing(true);

    try {
      const payload = {
        phone_number: normalizedPhone,
        order_reference: orderReference,
      };

      return await paymentsAPI.retryMpesaPayment(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to retry payment";
      toast.error(message);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchPaymentStatus = async (orderReference: string) => {
    return paymentsAPI.getPaymentStatus(orderReference);
  };

  const clearCartAfterPayment = () => {
    clearCart();
  };

  return {
    createOrder,
    initiateMpesaPayment,
    retryMpesaPayment,
    fetchPaymentStatus,
    clearCartAfterPayment,
    isProcessing,
    validateFormData,
  };
};
