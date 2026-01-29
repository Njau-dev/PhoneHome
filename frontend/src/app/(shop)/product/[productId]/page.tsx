"use client";

import { useParams } from "next/navigation";
import { useProduct } from "@/lib/hooks";
import BrandedSpinner from "@/components/common/BrandedSpinner";
import Breadcrumbs from "@/components/common/BreadCrumbs";
import ProductImageGallery from "@/components/product/ProductImageGallery";
import ProductInfo from "@/components/product/ProductInfo";
import RelatedProducts from "@/components/product/RelatedProducts";
import ProductTabs from "@/components/product/ProductTab";
import Link from "next/link";

export default function ProductPage() {
    const params = useParams();
    const productId = parseInt(params.productId as string);
    const { product, isLoading, error } = useProduct(productId);

    if (isLoading) {
        return <BrandedSpinner message="Loading product..." />;
    }

    if (error || !product) {
        return (
            <div className="flex flex-col items-center justify-center min-h-100 text-center">
                <p className="text-error mb-4">
                    {error ? "Failed to load product" : "Product not found"}
                </p>
                <Link
                    href="/collection"
                    className="bg-accent hover:bg-bg hover:text-accent border border-transparent hover:border-accent text-bg font-medium py-2 px-6 rounded-full transition-all"
                >
                    Back to Collection
                </Link>
            </div>
        );
    }

    return (
        <>
            <Breadcrumbs productData={product} />

            <div className="pt-4 transition-opacity ease-in duration-500 opacity-100">
                {/* Product Images and Info */}
                <div className="flex gap-12 flex-col sm:flex-row sm:items-start">
                    <ProductImageGallery
                        images={product.image_urls}
                        productName={product.name}
                    />
                    <ProductInfo
                        product={product}
                        variations={(product as any).variations}
                    />
                </div>

                {/* Product Tabs (Description & Reviews) */}
                <ProductTabs productData={product} />

                {/* Related Products */}
                <RelatedProducts
                    category={product.type}
                    brand={product.brand}
                    currentProductId={product.id}
                />
            </div>
        </>
    );
}
