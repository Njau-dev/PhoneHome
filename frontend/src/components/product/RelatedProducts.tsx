"use client";

import { useProducts } from "@/lib/hooks";
import ProductItem from "./ProductItem";
import Title from "@/components/common/Title";
import { ProductType } from "@/lib/types/product";

interface RelatedProductsProps {
  category: string;
  brand: string;
  currentProductId: number;
}

const RelatedProducts = ({ category, brand, currentProductId }: RelatedProductsProps) => {
  const { allProducts } = useProducts();

  const relatedProducts = allProducts
    .filter(
      (p) =>
        p.type === category.toLowerCase() &&
        p.brand === brand &&
        p.id !== currentProductId
    )
    .slice(0, 5);

  if (relatedProducts.length === 0) return null;

  return (
    <div className="my-24">
      <div className="text-center text-3xl py-2">
        <Title text1="RELATED" text2="PRODUCTS" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
        {relatedProducts.map((product) => (
          <ProductItem key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default RelatedProducts;
