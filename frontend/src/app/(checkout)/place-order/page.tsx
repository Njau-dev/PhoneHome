"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Title from "@/components/common/Title";
import CartTotal from "@/components/cart/CartTotal";
import DeliveryForm from "@/components/checkout/DeliveryForm";
import PaymentMethodSelector from "@/components/checkout/PaymentMethodSelector";
import Breadcrumbs from "@/components/common/BreadCrumbs";
import MpesaPaymentModal from "@/components/common/MpesaPaymentModal";
import { useAuth, useCart, usePayment } from "@/lib/hooks";
import { DELIVERY_FEE } from "@/lib/utils/constants";
import { toast } from "sonner";

export default function PlaceOrderPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { getTotal } = useCart();
  const { createOrder, isProcessing, validateFormData } = usePayment();
  const totalAmount = getTotal() + DELIVERY_FEE;

  const [selectedMethod, setSelectedMethod] = useState<"COD" | "PAY_ON_ORDER">("COD");
  const [selectedPaymentOption, setSelectedPaymentOption] = useState("MPESA");
  const [showMpesaModal, setShowMpesaModal] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    street: "",
    additionalInfo: "",
  });

  const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((data) => ({ ...data, [name]: value }));
  };

  const handleMpesaPayment = () => {
    if (!validateFormData(formData)) {
      return;
    }
    setShowMpesaModal(true);
  };

  const handlePayOnOrder = () => {
    if (!isAuthenticated) {
      toast.info("Please log in to complete the order");
      router.push("/login?redirect=/place-order");
      return;
    }

    switch (selectedPaymentOption) {
      case "MPESA":
        handleMpesaPayment();
        break;
      case "PAYPAL":
        toast.info("PayPal payment coming soon!");
        break;
      case "CARD":
        toast.info("Card payment coming soon!");
        break;
      default:
        toast.warning("Please select a payment option");
    }
  };

  const onSubmitHandler = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.info("Please log in to complete the order");
      router.push("/login?redirect=/place-order");
      return;
    }

    if (selectedMethod === "COD") {
      await createOrder(formData, "COD", DELIVERY_FEE);
    } else if (selectedMethod === "PAY_ON_ORDER") {
      handlePayOnOrder();
    }
  };

  return (
    <>
      <Breadcrumbs />
      <form onSubmit={onSubmitHandler} className="flex flex-col sm:flex-row justify-between gap-4 pt-3 sm:pt-10 min-h-[70vh]">
        {/* Left Side - Delivery Information */}
        <div className="flex flex-col gap-4 w-full sm:max-w-187.5">
          <div className="text-xl sm:text-2xl my-3">
            <Title text1="DELIVERY" text2="INFORMATION" />
          </div>
          <DeliveryForm formData={formData} onChange={onChangeHandler} />
        </div>

        {/* Right Side - Cart Total & Payment */}
        <div className="mt-8 border-2 border-accent p-3 rounded-lg">
          <div className="w-full lg:min-w-105 p-2 sm:p-4">
            <CartTotal />
          </div>

          <div className="mt-4 p-2 sm:px-4 text-base sm:text-lg">
            <Title text1="PAYMENT" text2="METHOD" />

            <PaymentMethodSelector
              selectedMethod={selectedMethod}
              onSelectMethod={setSelectedMethod}
              selectedPaymentOption={selectedPaymentOption}
              onSelectPaymentOption={setSelectedPaymentOption}
            />

            <div className="w-full text-center mt-8">
              {selectedMethod === "PAY_ON_ORDER" ? (
                <button
                  type="button"
                  onClick={handlePayOnOrder}
                  disabled={isProcessing}
                  className="bg-accent hover:bg-bg hover:text-accent border border-transparent hover:border-accent rounded text-bg text-base mt-8 mb-3 py-3 px-12 transition-all disabled:opacity-50"
                >
                  {isProcessing ? "Processing..." : "PAY NOW"}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="bg-accent hover:bg-bg hover:text-accent border border-transparent hover:border-accent rounded text-bg text-base mt-8 mb-3 py-3 px-12 transition-all disabled:opacity-50"
                >
                  {isProcessing ? "Processing..." : "PLACE ORDER"}
                </button>
              )}
            </div>
          </div>
        </div>
      </form>

      <MpesaPaymentModal
        isOpen={showMpesaModal}
        onClose={() => setShowMpesaModal(false)}
        mode="initiate"
        totalAmount={totalAmount}
        address={formData}
        onModalClose={() => {
          setShowMpesaModal(false);
          router.push("/orders");
        }}
      />
    </>
  );
}
