import { useEffect } from 'react';
import { useHomeStore } from '@/lib/stores/useHomeStore';
import { ProductType } from '@/lib/types/product';

/**
 * Custom hook for home page data.
 * Wraps useHomeStore and auto-triggers fetches on first mount.
 */
export const useHome = () => {
    const featuredBanners = useHomeStore(s => s.featuredBanners);
    const trendingProducts = useHomeStore(s => s.trendingProducts);
    const bestDeals = useHomeStore(s => s.bestDeals);
    const brands = useHomeStore(s => s.brands);
    const brandProducts = useHomeStore(s => s.brandProducts);

    const isLoadingProducts = useHomeStore(s => s.isLoadingProducts);
    const isLoadingDeals = useHomeStore(s => s.isLoadingDeals);
    const isLoadingBrands = useHomeStore(s => s.isLoadingBrands);
    const isLoadingBrandProducts = useHomeStore(s => s.isLoadingBrandProducts);
    const selectedProductType = useHomeStore(s => s.selectedProductType);
    const productTypes = useHomeStore(s => s.productTypes);
    const setSelectedProductType = useHomeStore(s => s.setSelectedProductType);

    const fetchFeaturedBanners = useHomeStore(s => s.fetchFeaturedBanners);
    const fetchTrendingProducts = useHomeStore(s => s.fetchTrendingProducts);
    const fetchBestDeals = useHomeStore(s => s.fetchBestDeals);
    const fetchBrands = useHomeStore(s => s.fetchBrands);
    const fetchAllBrandProducts = useHomeStore(s => s.fetchAllBrandProducts);


    // Hero banners (static — just sets state from constant, no network call)
    useEffect(() => {
        if (featuredBanners.length === 0) {
            fetchFeaturedBanners();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Trending products for the default selected type
    useEffect(() => {
        if (trendingProducts.length === 0) {
            fetchTrendingProducts();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Best deals
    useEffect(() => {
        if (bestDeals.length === 0) {
            fetchBestDeals();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Brands (step 1) — fetch once
    useEffect(() => {
        if (brands.length === 0) {
            fetchBrands();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Brand products (step 2) — runs whenever brands array changes
    useEffect(() => {
        if (
            brands.length > 0 &&
            Object.keys(brandProducts).length === 0
        ) {
            fetchAllBrandProducts();
        }
    }, [brands]); // eslint-disable-line react-hooks/exhaustive-deps

    return {
        // ── Hero ──────────────────────────────────────────────────────────────
        featuredBanners: featuredBanners,

        // ── Trending products ─────────────────────────────────────────────────
        trendingProducts: trendingProducts,
        isLoadingProducts: isLoadingProducts,
        selectedProductType: selectedProductType,
        productTypes: productTypes,
        setProductType: (type: ProductType) => setSelectedProductType(type),
        refreshProducts: fetchTrendingProducts,

        // ── Best deals ────────────────────────────────────────────────────────
        bestDeals: bestDeals,
        isLoadingDeals: isLoadingDeals,
        refreshDeals: fetchBestDeals,

        // ── Brands ────────────────────────────────────────────────────────────
        brands: brands,
        isLoadingBrands: isLoadingBrands,
        brandProducts: brandProducts,
        isLoadingBrandProducts: isLoadingBrandProducts,
        refreshBrands: fetchBrands,
    };
};