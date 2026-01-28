"use client";

import Link from "next/link";
import { Product } from "@/lib/types/product";
import { CURRENCY } from "@/lib/utils/constants";
import { formatPrice } from "@/lib/utils/format";
import { Heart, ShoppingCart, Star, Eye, GitCompareArrows } from "lucide-react";
import { useCartStore } from "@/lib/stores/useCartStore";
import { useWishlistStore } from "@/lib/stores/useWishlistStore";
import { useCompareStore } from "@/lib/stores/useCompareStore";
import { useState } from "react";

interface ProductItemProps {
  product: Product;
}

const ProductItem = ({ product }: ProductItemProps) => {
  const {
    id,
    name,
    price,
    image_urls,
    rating = 0,
    review_count = 0,
    category,
    hasVariation,
    type
  } = product;

  const { addItem: addCartItem } = useCartStore();
  const { addItem: addWishlistItem } = useWishlistStore();
  const { addItem: addCompareItem } = useCompareStore();
  const [isHovered, setIsHovered] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addCartItem(product.id);
  };

  const handleAddToWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addWishlistItem(product.id);
  };

  const handleAddToCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addCompareItem(product);
  };

  const renderStars = () => {
    const roundedRating = Math.round(rating);
    return [1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className="w-3 h-3"
        fill={star <= roundedRating ? "var(--accent)" : "none"}
        stroke="var(--accent)"
        strokeWidth={1.5}
      />
    ));
  };

  return (
    <div
      className="group relative overflow-hidden rounded-md border border-border hover:border-accent hover:rounded-none transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/product/${id}`} className="block">
        {/* Product Image Container */}
        <div className="relative overflow-hidden">
          <img
            src={image_urls[0]}
            alt={name}
            className="w-full h-40 lg:h-64 object-cover transition-transform duration-700 group-hover:scale-105"
          />

          {/* Multiple Options Badge */}
          {hasVariation && (
            <div className="absolute top-3 right-3 bg-accent text-bg px-2 py-1 rounded text-xs font-medium">
              Multiple Options
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-2 sm:p-4 bg-bg">
          <p className="text-sm text-secondary capitalize">{category}</p>
          <p className="text-sm font-medium mt-1 truncate">{name}</p>

          {/* Rating Section */}
          <div className="flex items-center mt-1 mb-1">
            <div className="flex mr-2">{renderStars()}</div>
            <span className="text-xs text-secondary">
              ({review_count}) {review_count === 1 ? 'review' : review_count < 1 ? '' : 'reviews'}
            </span>
          </div>

          {/* Price */}
          <p className="text-sm font-bold mt-1 text-accent">
            {CURRENCY} {formatPrice(price)}
          </p>
        </div>
      </Link>

      {/* Action Buttons - Slide up on hover */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-bg border-t border-border transform transition-transform duration-300 p-2 md:p-3 flex justify-between items-center ${isHovered ? 'translate-y-0' : 'translate-y-full'
          }`}
      >
        {/* Compare Button */}
        <button
          className="mr-2 p-2 border border-border rounded hover:border-accent hover:bg-accent/10 transition-colors"
          onClick={handleAddToCompare}
          title="Add to Compare"
        >
          <GitCompareArrows className="w-4 h-4 text-accent" />
        </button>

        {/* Cart/View Button */}
        {hasVariation ? (
          <Link
            href={`/product/${id}`}
            className="flex-1 bg-accent text-bg py-2 rounded text-center text-sm font-medium flex items-center justify-center hover:bg-bg hover:border hover:border-accent hover:text-accent transition-all"
            title="View Product"
          >
            <span className="hidden md:block mr-2">View</span>
            <Eye className="w-4 h-4" />
          </Link>
        ) : (
          <button
            onClick={handleAddToCart}
            className="flex-1 bg-accent text-bg py-2 rounded text-center text-sm font-medium flex items-center justify-center hover:bg-bg hover:border hover:border-accent hover:text-accent transition-all"
            title="Add to Cart"
          >
            <span className="hidden md:block mr-2">Cart</span>
            <ShoppingCart className="w-4 h-4" />
          </button>
        )}

        {/* Wishlist Button */}
        <button
          className="ml-2 p-2 border border-border rounded hover:border-accent hover:bg-accent/10 transition-colors"
          onClick={handleAddToWishlist}
          title="Add to Wishlist"
        >
          <Heart className="w-4 h-4 text-accent" />
        </button>
      </div>
    </div>
  );
};

export default ProductItem;