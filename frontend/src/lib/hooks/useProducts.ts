import { useQuery } from "@tanstack/react-query";
import { productsAPI } from "@/lib/api/products";
import { ProductType } from "@/lib/types/product";

export const useProducts = () => {
  const { data: allProducts = [], isLoading, error } = useQuery({
    queryKey: ["products"],
    queryFn: productsAPI.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const products = {
    phones: allProducts.filter((p) => p.type === "phone"),
    tablets: allProducts.filter((p) => p.type === "tablet"),
    laptops: allProducts.filter((p) => p.type === "laptop"),
    audio: allProducts.filter((p) => p.type === "audio"),
  };

  const getByCategory = (category: ProductType) => {
    return allProducts.filter((p) => p.type === category);
  };

  const getBestSellers = () => {
    return allProducts.filter((p) => p.isBestSeller);
  };

  const searchProducts = (query: string) => {
    if (!query.trim()) return allProducts;
    
    const lowerQuery = query.toLowerCase();
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description?.toLowerCase().includes(lowerQuery)
    );
  };

  return {
    products,
    allProducts,
    isLoading,
    error,
    getByCategory,
    getBestSellers,
    searchProducts,
  };
};

export const useProduct = (id: number) => {
  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productsAPI.getById(id),
    enabled: !!id,
  });

  return { product, isLoading, error };
};
