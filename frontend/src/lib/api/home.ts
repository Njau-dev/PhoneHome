import { apiClient } from './client';
import { Product, ProductType, Brand } from '@/lib/types/product';

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

/** Brand type extended with the product count returned by the updated backend */
export interface BrandWithCount extends Brand {
    product_count: number;
}

export interface ApiResponse {
    success: boolean;
    data: { products: Product[] };
    message: string;
}

export interface BrandsApiResponse {
    success: boolean;
    data: { brands: BrandWithCount[] };
    message: string;
}

export interface GetProductsParams {
    type?: ProductType;
    category?: string;
    brand?: string;
    best_seller?: boolean;
    limit?: number;
    sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc';
}

// ─── Products ────────────────────────────────────────────────────────────────

export const getProducts = async (params?: GetProductsParams): Promise<Product[]> => {
    try {
        const queryParams = new URLSearchParams();
        if (params?.type) queryParams.append('type', params.type);
        if (params?.category) queryParams.append('category', params.category);
        if (params?.brand) queryParams.append('brand', params.brand);
        if (params?.best_seller) queryParams.append('best_seller', 'true');
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.sort) queryParams.append('sort', params.sort);

        const response: ApiResponse = await apiClient.get(`/products?${queryParams.toString()}`);
        if (response.success) return response.data.products;
        return [];
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
};

/** Most-recently added products (trending) */
export const getTrendingProducts = async (
    type?: ProductType,
    limit: number = 10,
): Promise<Product[]> =>
    getProducts({ type, limit, sort: 'newest' });

/** Best-seller products */
export const getBestSellerProducts = async (
    type?: ProductType,
    limit: number = 10,
): Promise<Product[]> =>
    getProducts({ type, best_seller: true, limit });

/** Best deals — alias for best sellers, defaults to 8 items */
export const getBestDeals = async (
    type?: ProductType,
    limit: number = 8,
): Promise<Product[]> =>
    getProducts({ best_seller: true, type, limit });

/**
 * Fetch up to `limit` products for a given brand (by brand ID).
 * The backend filters on Product.brand == brandId.
 */
export const getProductsByBrand = async (
    brandId: string,
    limit: number = 5,
): Promise<Product[]> =>
    getProducts({ brand: brandId, limit });

// ─── Brands ──────────────────────────────────────────────────────────────────

/**
 * Fetch all brands.
 * The updated backend returns { id, name, product_count } for each brand.
 */
export const getBrands = async (): Promise<BrandWithCount[]> => {
    try {
        const response: BrandsApiResponse = await apiClient.get('/brands');
        if (response.success) return response.data.brands;
        return [];
    } catch (error) {
        console.error('Error fetching brands:', error);
        return [];
    }
};