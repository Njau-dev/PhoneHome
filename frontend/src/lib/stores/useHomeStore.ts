import { create } from 'zustand';
import { Product } from '@/lib/types/product';
import { getHomeData } from '@/lib/api/home';
import { FeaturedBanner, HomeState } from '../types/home';

// Static hero banner config — swap images / links to match your setup
const FEATURED_BANNERS: FeaturedBanner[] = [
    {
        id: '1',
        title: 'Latest',
        subtitle: 'Smartphones',
        description: 'Discover our newest collection of premium smartphones.',
        image: '/assets/images/phone-banner.png',
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
        image: '/assets/images/laptop-banner.png',
        backgroundColor: '#7e1d3d',
        textColor: '#ffffff',
        cta: 'Shop Now',
        ctaLink: '/collection?type=laptop',
        size: 'small',
        position: 6,
    },
    {
        id: '3',
        title: 'Best',
        subtitle: 'Tablets',
        image: '/assets/images/tablet-banner.png',
        backgroundColor: '#dc6446',
        textColor: '#ffffff',
        cta: 'Shop Now',
        ctaLink: '/collection?type=tablet',
        size: 'small',
        position: 5,
    },
    {
        id: '4',
        title: 'Audio',
        subtitle: 'Collection',
        image: '/assets/images/audio-banner.png',
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
        image: '/assets/images/apple-2024-2.png',
        backgroundColor: '#374151',
        textColor: '#ffffff',
        cta: 'Explore',
        ctaLink: '/collection',
        size: 'small',
        position: 3,
    },
    {
        id: '6',
        title: 'Deals &',
        subtitle: 'Offers',
        image: '/assets/images/apple-2024-2.png',
        backgroundColor: '#374151',
        textColor: '#ffffff',
        cta: 'Explore',
        ctaLink: '/collection',
        size: 'small',
        position: 2,
    }
];

export const useHomeStore = create<HomeState>((set, get) => ({
    featuredBanners: [],
    trending: [],
    bestDeals: [],
    brands: [],
    brandProducts: {},
    isLoading: false,
    hasFetchedHome: false,
    selectedProductType: 'phone',
    productTypes: [
        { value: 'phone', label: 'Phones' },
        { value: 'laptop', label: 'Laptops' },
        { value: 'tablet', label: 'Tablets' },
        { value: 'audio', label: 'Audio Products' },
    ],

    fetchFeaturedBanners: () => set({ featuredBanners: FEATURED_BANNERS }),

    fetchHome: async () => {
        const { hasFetchedHome, isLoading } = get();
        if (hasFetchedHome || isLoading) return;

        set({ isLoading: true });
        try {
            const data = await getHomeData();
            const brandProducts = Object.fromEntries(
                data.brands.map((brand) => [brand.id, brand.products ?? []]),
            ) as Record<number, Product[]>;

            set({
                trending: data.trending,
                bestDeals: data.bestDeals,
                brands: data.brands,
                brandProducts,
                hasFetchedHome: true,
            });
        } catch (err) {
            console.error('fetchHome:', err);
            set({
                trending: [],
                bestDeals: [],
                brands: [],
                brandProducts: {},
            });
        } finally {
            set({ isLoading: false });
        }
    },

    setSelectedProductType: (type) => {
        set({ selectedProductType: type });
    },
}));