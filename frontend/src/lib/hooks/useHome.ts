import { useEffect } from 'react';
import { useHomeStore } from '@/lib/stores/useHomeStore';

/**
 * Custom hook for home page data
 * Simplifies usage and provides a cleaner API
 */
export const useHome = () => {
    const store = useHomeStore();

    // Auto-fetch on mount
    useEffect(() => {
        if (store.featuredBanners.length === 0) {
            store.fetchFeaturedBanners();
        }
    }, [store]);

    useEffect(() => {
        if (store.trendingProducts.length === 0) {
            store.fetchTrendingProducts();
        }
    }, [store]);

    return {
        // State
        featuredBanners: store.featuredBanners,
        trendingProducts: store.trendingProducts,
        isLoadingBanners: store.isLoadingBanners,
        isLoadingProducts: store.isLoadingProducts,
        // selectedCategory: store.selectedCategory,
        // categories: store.categories,

        // Actions
        // setCategory: store.setSelectedCategory,
        refreshBanners: store.fetchFeaturedBanners,
        refreshProducts: store.fetchTrendingProducts,
    };
};