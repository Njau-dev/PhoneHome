import { useEffect, useMemo } from 'react';
import { useHomeStore } from '@/lib/stores/useHomeStore';
import { ProductType } from '@/lib/types/product';


export const useHome = () => {
    const featuredBanners = useHomeStore((s) => s.featuredBanners);
    const trending = useHomeStore((s) => s.trending);
    const bestDeals = useHomeStore((s) => s.bestDeals);
    const brands = useHomeStore((s) => s.brands);
    const brandProducts = useHomeStore((s) => s.brandProducts);
    const isLoading = useHomeStore((s) => s.isLoading);
    const selectedProductType = useHomeStore((s) => s.selectedProductType);
    const productTypes = useHomeStore((s) => s.productTypes);
    const setSelectedProductType = useHomeStore((s) => s.setSelectedProductType);
    const fetchFeaturedBanners = useHomeStore((s) => s.fetchFeaturedBanners);
    const fetchHome = useHomeStore((s) => s.fetchHome);

    useEffect(() => {
        if (featuredBanners.length === 0) {
            fetchFeaturedBanners();
        }

        void fetchHome();
    }, [featuredBanners.length, fetchFeaturedBanners, fetchHome]);

    const filteredTrending = useMemo(
        () => trending.filter((product) => product.type === selectedProductType),
        [trending, selectedProductType],
    );

    return {
        featuredBanners,
        trending,
        bestDeals,
        brands,
        brandProducts,
        isLoading,
        selectedProductType,
        productTypes,
        setProductType: (type: ProductType) => setSelectedProductType(type),
        filteredTrending,
        fetchHome,
    };
};

