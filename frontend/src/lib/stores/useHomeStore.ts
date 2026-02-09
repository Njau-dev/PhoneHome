import { create } from 'zustand';
import { Product, ProductType } from '@/lib/types/product';
import { getTrendingProducts } from '@/lib/api/home';

export interface FeaturedBanner {
    id: string;
    title: string;
    subtitle: string;
    description?: string;
    image: string;
    productId?: string;
    category?: string;
    backgroundColor: string;
    textColor?: string;
    cta: string;
    ctaLink: string;
    size: 'large' | 'small';
    position: number;
}

// Static featured banners configuration
// These are manually configured promotional banners
const FEATURED_BANNERS: FeaturedBanner[] = [
    {
        id: '1',
        title: 'Latest',
        subtitle: 'Smartphones',
        description: 'Discover our newest collection of premium smartphones with cutting-edge technology and amazing features.',
        image: '/images/banners/phones-banner.png',
        backgroundColor: '#1e3a8a',
        textColor: '#ffffff',
        cta: 'Shop Now',
        ctaLink: '/collection/phones',
        size: 'large',
        position: 1,
    },
    {
        id: '2',
        title: 'Premium',
        subtitle: 'Laptops',
        image: '/images/banners/laptops-banner.png',
        backgroundColor: '#7e1d3d',
        textColor: '#ffffff',
        cta: 'Shop Now',
        ctaLink: '/collection/laptops',
        size: 'small',
        position: 2,
    },
    {
        id: '3',
        title: 'Best',
        subtitle: 'Tablets',
        image: '/images/banners/tablets-banner.png',
        backgroundColor: '#dc6446',
        textColor: '#ffffff',
        cta: 'Shop Now',
        ctaLink: '/collection/tablets',
        size: 'small',
        position: 3,
    },
    {
        id: '4',
        title: 'Audio',
        subtitle: 'Collection',
        image: '/images/banners/audio-banner.png',
        backgroundColor: '#16a34a',
        textColor: '#ffffff',
        cta: 'Shop Now',
        ctaLink: '/collection/audio',
        size: 'small',
        position: 4,
    },
    {
        id: '5',
        title: 'New',
        subtitle: 'Arrivals',
        image: '/images/banners/new-arrivals.png',
        backgroundColor: '#374151',
        textColor: '#ffffff',
        cta: 'Explore',
        ctaLink: '/collection',
        size: 'small',
        position: 5,
    },
];

interface HomeState {
    featuredBanners: FeaturedBanner[];
    trendingProducts: Product[];
    isLoadingBanners: boolean;
    isLoadingProducts: boolean;
    selectedProductType: ProductType;
    productTypes: { value: ProductType; label: string }[];

    // Actions
    setFeaturedBanners: (banners: FeaturedBanner[]) => void;
    setTrendingProducts: (products: Product[]) => void;
    setSelectedProductType: (type: ProductType) => void;
    setLoadingBanners: (loading: boolean) => void;
    setLoadingProducts: (loading: boolean) => void;
    fetchFeaturedBanners: () => void;
    fetchTrendingProducts: (type?: ProductType) => Promise<void>;
}

export const useHomeStore = create<HomeState>((set, get) => ({
    featuredBanners: [],
    trendingProducts: [],
    isLoadingBanners: false,
    isLoadingProducts: false,
    selectedProductType: 'phone',
    productTypes: [
        { value: 'phone', label: 'Phones' },
        { value: 'laptop', label: 'Laptops' },
        { value: 'tablet', label: 'Tablets' },
        { value: 'audio', label: 'Audio Products' },
    ],

    setFeaturedBanners: (banners) => set({ featuredBanners: banners }),

    setTrendingProducts: (products) => set({ trendingProducts: products }),

    setSelectedProductType: (type) => {
        set({ selectedProductType: type });
        get().fetchTrendingProducts(type);
    },

    setLoadingBanners: (loading) => set({ isLoadingBanners: loading }),

    setLoadingProducts: (loading) => set({ isLoadingProducts: loading }),

    fetchFeaturedBanners: () => {
        // Featured banners are static configuration
        set({ featuredBanners: FEATURED_BANNERS });
    },

    fetchTrendingProducts: async (type?: ProductType) => {
        set({ isLoadingProducts: true });
        try {
            const selectedType = type || get().selectedProductType;

            // Fetch most recent products (trending)
            const products = await getTrendingProducts(selectedType, 10);

            set({ trendingProducts: products });
        } catch (error) {
            console.error('Error fetching trending products:', error);
            set({ trendingProducts: [] });
        } finally {
            set({ isLoadingProducts: false });
        }
    },
}));