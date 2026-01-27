"use client";

import Link from "next/link";
import { Product } from "@/lib/types/product";
import { CURRENCY } from "@/lib/utils/constants";
import { formatPrice } from "@/lib/utils/format";
import { Star } from "lucide-react";
import { useCartStore } from "@/lib/stores/useCartStore";
import { useWishlistStore } from "@/lib/stores/useWishlistStore";
import { useCompareStore } from "@/lib/stores/useCompareStore";

interface ProductItemProps {
  product: Product;
}

const ProductItem = ({ product }: ProductItemProps) => {
  const { id, name, price, image_urls, rating, review_count } = product;
  const { addItem: addCartItem } = useCartStore();
  const { addItem: addWishlistItem } = useWishlistStore();
  const { addItem: addCompareItem } = useCompareStore();


  return (
    <Link
      href={`/product/${id}`}
      className="group cursor-pointer border border-border rounded-lg overflow-hidden hover:border-accent transition-all duration-300 hover:shadow-lg"
    >
      {/* Product Image */}
      <div className="overflow-hidden bg-bg-light">
        <img
          src={image_urls[0]}
          alt={name}
          className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Product Info */}
      <div className="p-3 sm:p-4">
        <p className="text-sm sm:text-base font-medium text-primary mb-2 line-clamp-2 group-hover:text-accent transition-colors">
          {name}
        </p>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className="w-3 h-3 sm:w-4 sm:h-4"
              fill={star <= Math.round(rating || 0) ? "var(--accent)" : "none"}
              stroke="var(--accent)"
            />
          ))}
          <span className="text-xs sm:text-sm text-secondary ml-1">
            ({review_count || 0})
          </span>
        </div>

        {/* Price */}
        <p className="text-accent font-semibold text-sm sm:text-base">
          {CURRENCY} {formatPrice(price)}
        </p>
      </div>
    </Link>
  );
};

export default ProductItem;
