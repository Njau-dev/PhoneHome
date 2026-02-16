import { apiClient } from './client';
import { HomeApiResponse, HomeData } from '../types/home';

export const getHomeData = async (): Promise<HomeData> => {
    try {
        const response: HomeApiResponse = await apiClient.get('/home/');

        if (!response.success) {
            return { trending: [], bestDeals: [], brands: [] };
        }

        return response.data;
    } catch (error) {
        console.error('Error fetching home data:', error);
        return { trending: [], bestDeals: [], brands: [] };
    }
};
