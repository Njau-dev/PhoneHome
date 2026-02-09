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

interface ApiResponse {
    success: boolean;
    data: {
        products: Product[];
    };
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

/**
 * Fetch products with optional filters
 */
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

        if (response.success) {
            return response.data.products as Product[];
        }

        return [];
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
};

/**
 * Fetch trending products (most recent) by type
 */
export const getTrendingProducts = async (
    type?: ProductType,
    limit: number = 10
): Promise<Product[]> => {
    return getProducts({
        type,
        limit,
        sort: 'newest'
    });
};

/**
 * Fetch best seller products
 */
export const getBestSellerProducts = async (
    type?: ProductType,
    limit: number = 10
): Promise<Product[]> => {
    return getProducts({
        type,
        best_seller: true,
        limit
    });
};


/**
 * Fetch best deals (best seller products)
 */
export const getBestDeals = async (
    type?: ProductType,
    limit: number = 8
): Promise<Product[]> => {
    try {
        const queryParams = new URLSearchParams();

        if (type) queryParams.append('type', type);
        queryParams.append('best_seller', 'true');
        queryParams.append('limit', limit.toString());

        const response = await apiClient.get(`/products?${queryParams.toString()}`);

        if (response.data.success) {
            return response.data.data.products as Product[];
        }

        return [];
    } catch (error) {
        console.error('Error fetching best deals:', error);
        throw error;
    }
};

/**
 * Fetch products by brand
 */
export const getProductsByBrand = async (
    brandId: string,
    limit: number = 10
): Promise<Product[]> => {
    try {
        const queryParams = new URLSearchParams();
        queryParams.append('brand', brandId);
        queryParams.append('limit', limit.toString());

        const response = await apiClient.get(`/products?${queryParams.toString()}`);

        if (response.data.success) {
            return response.data.data.products as Product[];
        }

        return [];
    } catch (error) {
        console.error('Error fetching products by brand:', error);
        throw error;
    }
};

/**
 * Fetch all brands
 * You'll need to create this endpoint in your backend
 */
export const getBrands = async (): Promise<Brand[]> => {
    try {
        const response = await apiClient.get('/brands');

        if (response.data.success) {
            return response.data.data.brands as Brand[];
        }

        return [];
    } catch (error) {
        console.error('Error fetching brands:', error);
        return [];
    }
};