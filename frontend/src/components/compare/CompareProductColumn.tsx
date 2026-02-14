"use client";

import Link from "next/link";
import { X, Eye, ShoppingCart } from "lucide-react";
import { Product } from "@/lib/types/product";
import { getCompareSpecifications, getSpecValue } from "@/lib/utils/compareSpecs";

interface CompareProductColumnProps {
  product: Product;
  onRemove: () => void;
  onAddToCart: () => void;
}

const CompareProductColumn = ({
  product,
  onRemove,
  onAddToCart,
}: CompareProductColumnProps) => {
  const specifications = getCompareSpecifications();
  const imageUrl =
    Array.isArray(product.image_urls) && product.image_urls.length > 0
      ? product.image_urls[0]
      : (product as { image_url?: string }).image_url ?? "/assets/logo.png";

  return (
    <div className="col-span-1">
      {/* Product Image */}
      <div className="relative h-48 md:h-64 flex flex-col items-center justify-center mb-4">
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 p-1 bg-error/20 text-error hover:bg-error/30 rounded-full transition-all z-10"
          title="Remove from comparison"
        >
          <X size={16} />
        </button>

        <Link href={`/product/${product.id}`}>
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-48 md:h-64 object-cover rounded-md"
          />
        </Link>
      </div>

      {/* Specifications */}
      {specifications.map((spec, index) => {
        const value = getSpecValue(product, spec.key);
        const displayValue = spec.format ? spec.format(value) : value;

        return (
          <div key={index} className="py-3 md:py-4 border-t border-border">
            <p
              className={`text-sm ${spec.key === "name" ? "font-medium hover:text-accent" : ""
                }`}
            >
              {displayValue}
            </p>
          </div>
        );
      })}

      {/* Action Button */}
      <div className="py-4 border-t border-border">
        {product.hasVariation ? (
          <Link
            href={`/product/${product.id}`}
            className="w-full bg-accent text-bg py-2 px-4 rounded-lg hover:bg-bg hover:text-accent border border-transparent hover:border-accent transition-all flex items-center justify-center gap-2"
          >
            <Eye size={16} />
            Select Options
          </Link>
        ) : (
          <button
            onClick={onAddToCart}
            className="w-full bg-accent text-bg py-2 px-4 rounded-lg hover:bg-bg hover:text-accent border border-transparent hover:border-accent transition-all flex items-center justify-center gap-2"
          >
            <ShoppingCart size={16} />
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
};

export default CompareProductColumn;
