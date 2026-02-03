"use client";

import { Product } from "@/lib/types/product";
import { CURRENCY } from "@/lib/utils/constants";
import { formatPrice } from "@/lib/utils/format";
import { X } from "lucide-react";

interface CartItemProps {
  product: Product;
  variationKey: string;
  quantity: number;
  price: number;
  onUpdateQuantity: (action: "increase" | "decrease") => void;
  onRemove: () => void;
}

const CartItem = ({
  product,
  variationKey,
  quantity,
  price,
  onUpdateQuantity,
  onRemove,
}: CartItemProps) => {
  const subtotal = price * quantity;

  return (
    <tr className="border border-border rounded-lg lg:border-x-0 relative mb-4 lg:mb-0 flex flex-col lg:table-row">
      {/* Product Image */}
      <td className="pt-8 lg:pt-6 lg:pb-6 flex items-center justify-center lg:table-cell">
        <img
          src={product.image_urls[0]}
          alt={product.name}
          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded"
        />
      </td>

      {/* Product Name & Variation */}
      <td className="py-4 lg:py-6 flex flex-col items-center lg:items-start lg:table-cell lg:align-middle">
        <p className="font-medium text-xl">{product.name}</p>
        {variationKey !== "null" && (
          <p className="text-sm text-secondary pt-1">{variationKey}</p>
        )}
      </td>

      {/* Price */}
      <td className="py-4 lg:py-6 flex items-center justify-around w-full lg:w-auto lg:justify-start lg:table-cell lg:align-middle">
        <p className="lg:hidden font-medium">Price:</p>
        <p>
          {CURRENCY} {formatPrice(price)}
        </p>
      </td>

      {/* Quantity */}
      <td className="py-4 lg:py-6 flex items-center justify-around w-full lg:w-auto lg:justify-start lg:table-cell lg:align-middle">
        <p className="lg:hidden font-medium">Quantity:</p>
        <div className="flex w-fit bg-bg-light border border-border rounded items-center gap-2">
          <button
            onClick={() => onUpdateQuantity("decrease")}
            className="px-3 py-1 hover:text-accent transition-colors"
          >
            -
          </button>
          <span className="px-2">{quantity}</span>
          <button
            onClick={() => onUpdateQuantity("increase")}
            className="px-3 py-1 hover:text-accent transition-colors"
          >
            +
          </button>
        </div>
      </td>

      {/* Subtotal */}
      <td className="pb-8 pt-4 lg:py-6 flex items-center justify-around w-full lg:w-auto lg:justify-start lg:table-cell lg:align-middle">
        <p className="lg:hidden font-semibold">Subtotal:</p>
        <p className="text-accent">
          {CURRENCY} {formatPrice(subtotal)}
        </p>
      </td>

      {/* Remove Button */}
      <td className="py-4 lg:py-6 flex items-center justify-center lg:justify-start absolute top-2 right-3 lg:static lg:table-cell lg:align-middle">
        <button onClick={onRemove} aria-label="Remove item">
          <X className="text-error size-5 hover:scale-110 transition-transform" />
        </button>
      </td>
    </tr>
  );
};

export default CartItem;