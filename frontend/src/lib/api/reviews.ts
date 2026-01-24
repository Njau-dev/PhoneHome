import { apiClient } from "./client";
import { Review } from "@/lib/types/review";

interface ReviewsResponse {
  success: boolean;
  data: {
    reviews: Review[];
  };
  message: string;
}

interface ReviewResponse {
  success: boolean;
  data: {
    review: Review;
  };
  message: string;
}

export const reviewsAPI = {
  getByProduct: async (productId: number): Promise<Review[]> => {
    const response: ReviewsResponse = await apiClient.get(`/products/${productId}/reviews`);
    return response.data.reviews;
  },

  create: async (productId: number, rating: number, comment: string): Promise<Review> => {
    const response: ReviewResponse = await apiClient.post(`/products/${productId}/reviews`, {
      rating,
      comment,
    });
    return response.data.review;
  },

  update: async (reviewId: number, rating: number, comment: string): Promise<Review> => {
    const response: ReviewResponse = await apiClient.patch(`/reviews/${reviewId}`, {
      rating,
      comment,
    });
    return response.data.review;
  },

  delete: async (reviewId: number): Promise<{ success: boolean; message: string }> => {
    return await apiClient.delete(`/reviews/${reviewId}`);
  },
};
