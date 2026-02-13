"use client";

import Link from "next/link";
import { RefreshCcw } from "lucide-react";
import { useCompare, useCart } from "@/lib/hooks";
import BrandedSpinner from "@/components/common/BrandedSpinner";
import Title from "@/components/common/Title";
import CompareProductColumn from "@/components/compare/CompareProductColumn";
import EmptyCompareSlot from "@/components/compare/EmptyCompareSlot";
import { getCompareSpecifications } from "@/lib/utils/compareSpecs";
import { Product } from "@/lib/types/product";

export default function ComparePage() {
    const { items, isLoading, removeFromCompare, syncWithServer } = useCompare();
    const { addItem } = useCart();
    const specifications = getCompareSpecifications();

    const handleAddToCart = (product: Product) => {
        if (product.hasVariation) {
            // if product has variation view first before adding to cart 
        } else {
            addItem(product.id, undefined, 1, product.price);
        }
    };

    if (isLoading) {
        return <BrandedSpinner message="Loading comparison..." />;
    }

    return (
        <div className="pt-4 pb-16">
            <div className="container mx-auto">
                {/* Header */}
                <div className="mb-12 text-center text-2xl sm:text-3xl">
                    <Title text1="PRODUCT" text2="COMPARISON" />
                    <p className="text-secondary w-3/4 m-auto text-sm sm:text-base mx-auto">
                        Compare product features side by side to make the best choice
                    </p>
                </div>

                {items.length > 0 ? (
                    <div className="bg-bg-card rounded-md border border-border py-6 pr-6 lg:pl-6 overflow-x-auto">
                        <div className="min-w-3xl">
                            <div className="grid grid-cols-4 gap-4">
                                {/* Specification Labels Column */}
                                <div className="col-span-1 sticky left-0 z-10 border-r border-border">
                                    <div className="absolute inset-0 bg-bg-card" />
                                    <div className="relative z-30 px-2 h-full">
                                        <div className="h-48 md:h-64 flex items-end justify-center mb-4">
                                            <p className="text-base md:text-lg font-bold text-accent">
                                                Specifications
                                            </p>
                                        </div>

                                        {specifications.map((spec, index) => (
                                            <div key={index} className="py-3 md:py-4 border-t border-border">
                                                <p className="text-sm font-medium text-center">{spec.name}</p>
                                            </div>
                                        ))}

                                        <div className="py-3 md:py-4 border-t border-border"></div>
                                    </div>
                                </div>

                                {/* Product Columns */}
                                <div className="col-span-3">
                                    <div className="grid grid-cols-3 gap-4">
                                        {items.map((product) => (
                                            <CompareProductColumn
                                                key={product.id}
                                                product={product}
                                                onRemove={() => removeFromCompare(product.id)}
                                                onAddToCart={() => handleAddToCart(product)}
                                            />
                                        ))}

                                        {/* Empty slots */}
                                        {Array.from({ length: Math.max(0, 3 - items.length) }).map((_, i) => (
                                            <EmptyCompareSlot key={`empty-${i}`} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 bg-bg-card rounded-xl p-6 border border-border shadow-md">
                        <h3 className="text-xl font-bold mb-4">No products to compare</h3>
                        <p className="text-secondary mb-8">
                            Add products to comparison from your wishlist or product pages
                        </p>
                        <Link href="/collection">
                            <button className="bg-accent text-bg px-8 py-3 rounded-full hover:bg-bg hover:text-accent border border-transparent hover:border-accent transition-all">
                                Browse Products
                            </button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
