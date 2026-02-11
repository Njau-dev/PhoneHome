import { Brand, Product, ProductType } from "./product";

export interface HomeState {
    featuredBanners: FeaturedBanner[];

    // Home API payload
    trending: Product[];
    bestDeals: Product[];
    brands: BrandWithCount[];
    brandProducts: Record<number, Product[]>;
    isLoading: boolean;
    hasFetchedHome: boolean;

    // UI state
    selectedProductType: ProductType;
    productTypes: { value: ProductType; label: string }[];

    // Actions
    fetchFeaturedBanners: () => void;
    fetchHome: () => Promise<void>;
    setSelectedProductType: (type: ProductType) => void;
}

export interface HomeData {
    trending: Product[];
    bestDeals: Product[];
    brands: BrandWithCount[];
}

export interface HomeApiResponse {
    success: boolean;
    data: HomeData;
    message: string;
}

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

/** Brand type extended with product count*/
export interface BrandWithCount extends Brand {
    product_count: number;
    products: Product[];
}
