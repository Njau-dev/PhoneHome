import { create } from 'zustand';
import { Product, ProductType } from '@/lib/types/product';
import {
    FeaturedBanner,
    BrandWithCount,
    getTrendingProducts,
    getBestDeals,
    getBrands,
    getProductsByBrand,
} from '@/lib/api/home';

// Static hero banner config — swap images / links to match your setup
const FEATURED_BANNERS: FeaturedBanner[] = [
    {
        id: '1',
        title: 'Latest',
        subtitle: 'Smartphones',
        description: 'Discover our newest collection of premium smartphones.',
        image: '/assets/images/phone-banner.jpg',
        backgroundColor: '#1e3a8a',
        textColor: '#ffffff',
        cta: 'Shop Now',
        ctaLink: '/collection?type=phone',
        size: 'large',
        position: 1,
    },
    {
        id: '2',
        title: 'Premium',
        subtitle: 'Laptops',
        image: '/assets/images/laptop-category.png',
        backgroundColor: '#7e1d3d',
        textColor: '#ffffff',
        cta: 'Shop Now',
        ctaLink: '/collection?type=laptop',
        size: 'small',
        position: 2,
    },
    {
        id: '3',
        title: 'Best',
        subtitle: 'Tablets',
        image: '/assets/images/ipad_pro_home.jpg',
        backgroundColor: '#dc6446',
        textColor: '#ffffff',
        cta: 'Shop Now',
        ctaLink: '/collection?type=tablet',
        size: 'small',
        position: 3,
    },
    {
        id: '4',
        title: 'Audio',
        subtitle: 'Collection',
        image: '/assets/images/Airpods-Max-e.png',
        backgroundColor: '#16a34a',
        textColor: '#ffffff',
        cta: 'Shop Now',
        ctaLink: '/collection?type=audio',
        size: 'small',
        position: 4,
    },
    {
        id: '5',
        title: 'New',
        subtitle: 'Arrivals',
        image: '/assets/images/apple-2024-2.jpg',
        backgroundColor: '#374151',
        textColor: '#ffffff',
        cta: 'Explore',
        ctaLink: '/collection',
        size: 'small',
        position: 5,
    },
];

interface HomeState {
    // Hero
    featuredBanners: FeaturedBanner[];

    // Trending products
    trendingProducts: Product[];
    isLoadingProducts: boolean;
    selectedProductType: ProductType;
    productTypes: { value: ProductType; label: string }[];

    // Best deals
    bestDeals: Product[];
    isLoadingDeals: boolean;

    // Brands
    brands: BrandWithCount[];
    isLoadingBrands: boolean;
    /** brandId → up-to-5 products for that brand */
    brandProducts: Record<string, Product[]>;
    isLoadingBrandProducts: boolean;

    // Actions
    fetchFeaturedBanners: () => void;
    fetchTrendingProducts: (type?: ProductType) => Promise<void>;
    setSelectedProductType: (type: ProductType) => void;
    fetchBestDeals: () => Promise<void>;
    fetchBrands: () => Promise<void>;
    fetchAllBrandProducts: () => Promise<void>;
}

export const useHomeStore = create<HomeState>((set, get) => ({
    // ── Initial state ────────────────────────────────────────────────────────
    featuredBanners: [],
    trendingProducts: [],
    isLoadingProducts: false,
    selectedProductType: 'phone',
    productTypes: [
        { value: 'phone', label: 'Phones' },
        { value: 'laptop', label: 'Laptops' },
        { value: 'tablet', label: 'Tablets' },
        { value: 'audio', label: 'Audio Products' },
    ],
    bestDeals: [],
    isLoadingDeals: false,
    brands: [],
    isLoadingBrands: false,
    brandProducts: {},
    isLoadingBrandProducts: false,

    // ── Hero ─────────────────────────────────────────────────────────────────
    fetchFeaturedBanners: () => set({ featuredBanners: FEATURED_BANNERS }),

    // ── Trending products ────────────────────────────────────────────────────
    setSelectedProductType: (type) => {
        set({ selectedProductType: type });
        get().fetchTrendingProducts(type);
    },

    fetchTrendingProducts: async (type) => {
        set({ isLoadingProducts: true });
        try {
            const resolvedType = type ?? get().selectedProductType;
            const products = await getTrendingProducts(resolvedType, 10);
            set({ trendingProducts: products });
        } catch (err) {
            console.error('fetchTrendingProducts:', err);
            set({ trendingProducts: [] });
        } finally {
            set({ isLoadingProducts: false });
        }
    },

    // ── Best deals ───────────────────────────────────────────────────────────
    fetchBestDeals: async () => {
        set({ isLoadingDeals: true });
        try {
            const deals = await getBestDeals('phone', 8);
            set({ bestDeals: deals });
        } catch (err) {
            console.error('fetchBestDeals:', err);
            set({ bestDeals: [] });
        } finally {
            set({ isLoadingDeals: false });
        }
    },

    // ── Brands ───────────────────────────────────────────────────────────────
    fetchBrands: async () => {
        set({ isLoadingBrands: true });
        try {
            const brands = await getBrands();
            set({ brands });
        } catch (err) {
            console.error('fetchBrands:', err);
            set({ brands: [] });
        } finally {
            set({ isLoadingBrands: false });
        }
    },

    /**
     * Fire one getProductsByBrand request per brand in parallel then
     * store results in the brandProducts map.
     * Call this after fetchBrands() resolves.
     */
    fetchAllBrandProducts: async () => {
        const { brands } = get();
        if (brands.length === 0) return;

        set({ isLoadingBrandProducts: true });
        try {
            const pairs = await Promise.all(
                brands.map(async (brand) => {
                    const products = await getProductsByBrand(String(brand.id), 5);
                    return [brand.id, products] as const;
                }),
            );
            set({ brandProducts: Object.fromEntries(pairs) });
        } catch (err) {
            console.error('fetchAllBrandProducts:', err);
        } finally {
            set({ isLoadingBrandProducts: false });
        }
    },
}));
