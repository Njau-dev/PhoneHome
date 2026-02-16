"use client";

import { useEffect, useRef, useState } from "react";
import { X, Phone, Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { usePayment, PaymentFormData } from "@/lib/hooks/usePayment";

type PaymentStatus = "idle" | "pending" | "success" | "failed" | "timeout";

interface MpesaPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "initiate" | "retry";
  totalAmount?: number;
  address?: PaymentFormData;
  orderReference?: string;
  onModalClose?: () => void;
}

const MpesaPaymentModal = ({
  isOpen,
  onClose,
  mode = "initiate",
  totalAmount,
  address,
  orderReference,
  onModalClose,
}: MpesaPaymentModalProps) => {
  const {
    initiateMpesaPayment,
    retryMpesaPayment,
    fetchPaymentStatus,
    clearCartAfterPayment,
    isProcessing,
  } = usePayment();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [transactionId, setTransactionId] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [failureReason, setFailureReason] = useState("");
  const [activeOrderReference, setActiveOrderReference] = useState(orderReference || "");

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isRetry = mode === "retry";

  const clearPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, []);

  const resetState = () => {
    setPhoneNumber("");
    setPaymentStatus("idle");
    setTransactionId("");
    setCountdown(0);
    setFailureReason("");
    setActiveOrderReference(orderReference || "");
    clearPolling();
  };

  useEffect(() => {
    if (!isOpen || paymentStatus !== "pending" || countdown <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearPolling();
          setPaymentStatus("timeout");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, paymentStatus, isOpen]);

  const handlePhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d]/g, "");
    setPhoneNumber(value);
  };

  const startStatusPolling = (reference: string) => {
    clearPolling();
    setCountdown(120);
    setPaymentStatus("pending");

    pollIntervalRef.current = setInterval(async () => {
      try {
        const statusData = await fetchPaymentStatus(reference);
        const rawStatus = statusData.payment_status || "";
        const normalized = rawStatus.toLowerCase();

        if (normalized === "success") {
          setPaymentStatus("success");
          setTransactionId(statusData.transaction_id || statusData.mpesa_receipt || "");
          clearPolling();
          clearCartAfterPayment();
          toast.success("Payment successful!");
          return;
        }

        if (normalized === "failed") {
          setPaymentStatus("failed");
          setFailureReason(statusData.failure_reason || "Payment failed");
          clearPolling();
          toast.error("Payment failed");
        }
      } catch (error) {
        console.error("Status check error:", error);
      }
    }, 5000);
  };

  const initiatePayment = async () => {
    if (isRetry) {
      if (!orderReference) {
        toast.error("Order reference is required to retry payment");
        return;
      }

      const response = await retryMpesaPayment(phoneNumber, orderReference);
      if (!response?.order_reference) {
        return;
      }

      setActiveOrderReference(response.order_reference);
      toast.success("STK push sent! Please check your phone.");
      startStatusPolling(response.order_reference);
      return;
    }

    if (!address) {
      toast.error("Delivery address is required");
      return;
    }

    if (typeof totalAmount !== "number") {
      toast.error("Total amount is missing for this payment");
      return;
    }

    const response = await initiateMpesaPayment(phoneNumber, address, totalAmount);

    if (!response?.order_reference) {
      return;
    }

    setActiveOrderReference(response.order_reference);
    toast.success("STK push sent! Please check your phone.");
    startStatusPolling(response.order_reference);
  };

  const handleSimpleClose = () => {
    resetState();
    onClose();
  };

  const handleCloseWithRedirect = () => {
    resetState();
    if (onModalClose) {
      onModalClose();
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-bg-card border border-border rounded-xl max-w-md w-full p-6 relative">
        {(paymentStatus === "idle" ||
          paymentStatus === "failed" ||
          paymentStatus === "timeout") && (
          <button
            onClick={handleSimpleClose}
            className="absolute top-4 right-4 text-secondary hover:text-primary transition-colors"
          >
            <X size={20} />
          </button>
        )}

        {paymentStatus === "success" && (
          <button
            onClick={handleCloseWithRedirect}
            className="absolute top-4 right-4 text-secondary hover:text-primary transition-colors"
          >
            <X size={20} />
          </button>
        )}

        <div className="mb-6">
          <h2 className="text-xl font-bold text-primary mb-2">
            {isRetry ? "Retry M-Pesa Payment" : "M-Pesa Payment"}
          </h2>
          {typeof totalAmount === "number" && (
            <p className="text-secondary text-sm">
              Total Amount:{" "}
              <span className="text-accent font-semibold">
                KSh {totalAmount.toFixed(2)}
              </span>
            </p>
          )}
          {activeOrderReference && (
            <p className="text-accent text-xs mt-1">
              Order Reference: {activeOrderReference}
            </p>
          )}
        </div>

        {paymentStatus === "success" && (
          <div className="mb-6 p-4 bg-success/10 border border-success/30 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="text-success" size={22} />
              <p className="text-success font-medium">Payment Successful!</p>
            </div>
            <p className="text-success/90 text-sm mb-2">
              Your payment has been confirmed successfully.
            </p>
            {transactionId && (
              <p className="text-success text-xs">
                Transaction ID: {transactionId}
              </p>
            )}
            <p className="text-success text-xs mt-2">
              Press Continue to proceed...
            </p>
          </div>
        )}

        {paymentStatus === "failed" && (
          <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="text-error" size={22} />
              <p className="text-error font-medium">Payment Failed</p>
            </div>
            <p className="text-error/90 text-sm mb-2">
              {failureReason || "Payment was not successful"}
            </p>
            <p className="text-error/90 text-xs">
              You can retry payment from your orders page.
            </p>
          </div>
        )}

        {paymentStatus === "timeout" && (
          <div className="mb-6 p-4 bg-warning/10 border border-warning/30 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="text-warning" size={22} />
              <p className="text-warning font-medium">Payment Delayed</p>
            </div>
            <p className="text-warning/90 text-sm">
              Payment is taking longer than expected. You can check status or
              retry from your orders page.
            </p>
          </div>
        )}

        {paymentStatus === "pending" && (
          <div className="mb-6 p-4 bg-info/10 border border-info/30 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Loader2 className="text-info animate-spin" size={20} />
              <p className="text-info font-medium">STK Push Sent</p>
            </div>
            <p className="text-info/90 text-sm mb-2">
              Check your phone and enter your M-Pesa PIN to complete the payment.
            </p>
            {countdown > 0 && (
              <p className="text-info/80 text-xs">
                Timeout in: {Math.floor(countdown / 60)}:
                {(countdown % 60).toString().padStart(2, "0")}
              </p>
            )}
          </div>
        )}

        {paymentStatus === "idle" && (
          <div className="mb-6">
            <label className="block text-primary text-sm font-medium mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone
                className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary"
                size={18}
              />
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneInput}
                placeholder="0712345678 or 254712345678"
                className="w-full pl-10 pr-4 py-3 text-primary placeholder:text-secondary bg-transparent border border-border focus:border-accent focus:outline-none transition-colors duration-300 rounded"
                disabled={isProcessing}
              />
            </div>
            <p className="text-secondary text-xs mt-1">
              Enter your M-Pesa registered phone number.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          {paymentStatus === "idle" && (
            <>
              <button
                onClick={handleSimpleClose}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 text-secondary border border-border rounded hover:bg-bg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={initiatePayment}
                disabled={isProcessing || !phoneNumber}
                className="flex-1 px-4 py-2 bg-accent text-bg rounded hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : isRetry ? (
                  "Retry Payment"
                ) : (
                  "Pay Now"
                )}
              </button>
            </>
          )}

          {paymentStatus === "success" && (
            <button
              onClick={handleCloseWithRedirect}
              className="w-full px-4 py-2 bg-success text-bg rounded hover:bg-success/90 transition-colors"
            >
              Continue to Orders
            </button>
          )}

          {(paymentStatus === "failed" || paymentStatus === "timeout") && (
            <button
              onClick={handleCloseWithRedirect}
              className="w-full px-4 py-2 bg-accent text-bg rounded hover:bg-accent/90 transition-colors"
            >
              Go to Orders
            </button>
          )}
        </div>

        <div className="mt-4 text-xs text-secondary space-y-1">
          <p>• Make sure your phone has sufficient M-Pesa balance</p>
          <p>• You&apos;ll receive an STK push notification on your phone</p>
          <p>• Enter your M-Pesa PIN when prompted</p>
          {isRetry && <p>• This is a payment retry for an existing order</p>}
        </div>
      </div>
    </div>
  );
};

export default MpesaPaymentModal;
