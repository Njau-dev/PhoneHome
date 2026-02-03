"use client";

import { useState } from "react";
import Link from "next/link";
import { Product, ProductVariation } from "@/lib/types/product";
import { CURRENCY } from "@/lib/utils/constants";
import { formatPrice } from "@/lib/utils/format";
import { useCart, useWishlist, useCompare } from "@/lib/hooks";
import { toast } from "sonner";
import { Heart, SquareStack, Star } from "lucide-react";

interface ProductInfoProps {
  product: Product;
  variations?: ProductVariation[];
}

const ProductInfo = ({ product, variations = [] }: ProductInfoProps) => {
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(product.price);

  const { addItem } = useCart();
  const { addToWishlist } = useWishlist();
  const { addToCompare } = useCompare();

  const hasVariations = variations.length > 0;

  const handleVariationSelect = (variation: ProductVariation) => {
    setSelectedVariation(variation);
    setPrice(variation.price);
  };

  const handleAddToCart = () => {
    if (hasVariations && !selectedVariation) {
      toast.error("Please select a variation before adding to cart");
      return;
    }

    if (hasVariations) {
      addItem(product.id, selectedVariation || undefined, quantity);
    } else {
      addItem(product.id, undefined, quantity, product.price);
    }
  };

  const handleQuantityChange = (action: "increase" | "decrease") => {
    setQuantity((prev) =>
      action === "increase" ? prev + 1 : prev > 1 ? prev - 1 : 1
    );
  };

  return (
    <div className="flex-1">
      <h1 className="font-medium text-3xl mt-2">{product.name}</h1>

      {/* Ratings */}
      <div className="flex items-center gap-1 mt-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className="w-5 h-5"
            fill={star <= Math.round(product.rating || 0) ? "var(--accent)" : "none"}
            stroke="var(--accent)"
          />
        ))}
        <p className="pl-2 text-sm">({product.review_count || 0}) Reviews</p>
        {
          product.rating ?
            product.rating > 0 && (
              <span className="text-sm font-medium ml-1">
                {product.rating.toFixed(1)}
              </span>
            ) : null}
      </div>

      {/* Price */}
      <p className="mt-5 text-2xl font-medium text-accent">
        {CURRENCY} {formatPrice(price)}
      </p>

      {/* Key Features */}
      <div className="mt-4">
        <h2 className="text-lg font-medium">Key Features</h2>
        <ul className="mt-2 list-disc pl-5 space-y-2 text-secondary">
          {product.type === "phone" || product.type === "tablet" ? (
            <>
              <li><strong>RAM:</strong> {(product as any).ram}</li>
              <li><strong>Storage:</strong> {(product as any).storage}</li>
              <li><strong>Processor:</strong> {(product as any).processor}</li>
              <li><strong>Main Camera:</strong> {(product as any).main_camera}</li>
              <li><strong>Front Camera:</strong> {(product as any).front_camera}</li>
              <li><strong>Operating System:</strong> {(product as any).os}</li>
              <li><strong>Connectivity:</strong> {(product as any).connectivity}</li>
              <li><strong>Colors:</strong> {(product as any).colors}</li>
              <li><strong>Display:</strong> {(product as any).display}</li>
              <li><strong>Battery:</strong> {(product as any).battery}</li>
            </>
          ) : product.type === "laptop" ? (
            <>
              <li><strong>RAM:</strong> {(product as any).ram}</li>
              <li><strong>Storage:</strong> {(product as any).storage}</li>
              <li><strong>Display:</strong> {(product as any).display}</li>
              <li><strong>Processor:</strong> {(product as any).processor}</li>
              <li><strong>OS:</strong> {(product as any).os}</li>
              <li><strong>Battery:</strong> {(product as any).battery}</li>
            </>
          ) : (
            <li><strong>Battery:</strong> {(product as any).battery}</li>
          )}
        </ul>
      </div>

      {/* Contact Notice */}
      <div className="bg-bg-light rounded-md p-4 mt-6 border border-border">
        <p className="text-sm">
          Please{" "}
          <Link href="/contact" className="text-accent hover:underline">
            contact our shop
          </Link>{" "}
          directly before placing your order for the most accurate pricing information.
        </p>
      </div>

      {/* Variations */}
      {hasVariations && (
        <div className="flex flex-col gap-4 my-8">
          <p className="font-medium">Select Storage Variation</p>
          <div className="flex flex-wrap gap-2">
            {variations.map((variation, index) => (
              <button
                key={index}
                onClick={() => handleVariationSelect(variation)}
                className={`border rounded-3xl py-2 px-4 sm:py-3 sm:px-6 text-sm sm:text-base transition-all ${selectedVariation === variation
                  ? "bg-accent text-bg border-accent"
                  : "border-border hover:border-accent"
                  }`}
              >
                {variation.ram} / {variation.storage}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add to Cart Section */}
      <div className="flex items-center mt-4 space-x-4">
        {/* Quantity */}
        <div className="flex w-fit bg-bg-light hover:border-accent border border-border rounded-full transition-all">
          <button
            onClick={() => handleQuantityChange("decrease")}
            className="px-3 py-2 text-lg hover:text-accent transition-colors"
          >
            -
          </button>
          <input
            type="number"
            value={quantity}
            readOnly
            className="w-16 text-center text-primary text-lg outline-none bg-transparent"
          />
          <button
            onClick={() => handleQuantityChange("increase")}
            className="px-3 py-2 text-lg hover:text-accent transition-colors"
          >
            +
          </button>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={hasVariations && !selectedVariation}
          className={`bg-accent hover:bg-bg hover:text-accent border border-transparent hover:border-accent text-bg font-medium w-full sm:w-[60%] py-3 px-6 rounded-full transition-all ${hasVariations && !selectedVariation
            ? "opacity-50 cursor-not-allowed"
            : ""
            }`}
        >
          Add to Cart
        </button>
      </div>

      {/* Wishlist and Compare */}
      <div className="flex items-center mt-4 space-x-4">
        <button
          onClick={() => addToWishlist(product.id)}
          className="flex items-center gap-2 border border-border-light hover:text-accent hover:bg-border-light hover:border-accent px-6 py-3 rounded-full  transition-colors"
        >
          <Heart className="h-8 w-8 hover:fill-accent text-accent p-1.5 transition-all" />
          <span>Add to Wishlist</span>
        </button>

        <button
          onClick={() => addToCompare(product)}
          className="flex items-center gap-2 border border-border-light hover:text-accent hover:bg-border-light hover:border-accent px-6 py-3 rounded-full  transition-colors"
        >
          <SquareStack className="h-8 w-8 text-accent p-1.5 transition-all" />
          <span>Compare specs</span>
        </button>
      </div>
    </div>
  );
};

export default ProductInfo;
