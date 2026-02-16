"use client";

interface PaymentMethod {
  id: string;
  name: string;
  available: boolean;
}

interface PaymentMethodSelectorProps {
  selectedMethod: "COD" | "PAY_ON_ORDER";
  onSelectMethod: (method: "COD" | "PAY_ON_ORDER") => void;
  selectedPaymentOption: string;
  onSelectPaymentOption: (option: string) => void;
}

const PaymentMethodSelector = ({
  selectedMethod,
  onSelectMethod,
  selectedPaymentOption,
  onSelectPaymentOption,
}: PaymentMethodSelectorProps) => {
  const paymentOptions: PaymentMethod[] = [
    { id: "MPESA", name: "M-Pesa", available: true },
    { id: "PAYPAL", name: "PayPal", available: false },
    { id: "CARD", name: "Credit/Debit Card", available: false },
  ];

  return (
    <div className="flex gap-4 flex-col">
      {/* Cash on Delivery */}
      <div
        onClick={() => onSelectMethod("COD")}
        className={`flex items-center gap-3 p-2 px-3 cursor-pointer rounded transition-colors ${
          selectedMethod === "COD" ? "bg-bg-light" : ""
        }`}
      >
        <div
          className={`min-w-3.5 h-3.5 border rounded-full ${
            selectedMethod === "COD"
              ? "border-accent bg-accent"
              : "border-primary"
          }`}
        ></div>
        <p className="text-base font-medium">Cash on Delivery</p>
      </div>

      {selectedMethod === "COD" && (
        <div className="p-2 px-3 text-sm text-secondary border-l-2 bg-bg-light border-accent transition-all duration-300">
          Pay cash on delivery: Only applies for orders within Nairobi county.
        </div>
      )}

      {/* Pay on Order */}
      <div
        onClick={() => onSelectMethod("PAY_ON_ORDER")}
        className={`flex items-center gap-3 p-2 px-3 cursor-pointer rounded transition-colors ${
          selectedMethod === "PAY_ON_ORDER" ? "bg-bg-light" : ""
        }`}
      >
        <div
          className={`min-w-3.5 h-3.5 border rounded-full ${
            selectedMethod === "PAY_ON_ORDER"
              ? "border-accent bg-accent"
              : "border-primary"
          }`}
        ></div>
        <p className="text-base font-medium">Pay on Order</p>
      </div>

      {selectedMethod === "PAY_ON_ORDER" && (
        <div className="transition-all duration-300">
          <div className="p-2 px-3 text-sm text-secondary border-l-2 bg-bg-light border-accent mb-3">
            Pay when placing order: Available for all locations including outside
            Nairobi CBD.
          </div>

          {/* Payment Options */}
          <div className="ml-4 flex flex-col gap-2">
            {paymentOptions.map((option) => (
              <div
                key={option.id}
                onClick={() =>
                  option.available && onSelectPaymentOption(option.id)
                }
                className={`flex items-center gap-3 p-2 px-3 cursor-pointer rounded ${
                  !option.available ? "opacity-50 cursor-not-allowed" : ""
                } ${
                  selectedPaymentOption === option.id && option.available
                    ? "bg-bg-light"
                    : ""
                }`}
              >
                <div
                  className={`min-w-3 h-3 border rounded-full ${
                    selectedPaymentOption === option.id && option.available
                      ? "border-accent bg-accent"
                      : "border-primary"
                  }`}
                ></div>
                <p
                  className={`text-sm font-medium ${
                    !option.available ? "text-secondary" : ""
                  }`}
                >
                  {option.name}
                  {!option.available && " (Coming Soon)"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodSelector;
