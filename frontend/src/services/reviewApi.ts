import { fetchWithAuth } from './api';
import { ProductReviewSummary, Review, CreateReviewPayload } from '../types/review';

export const reviewApi = {
  getProductReviews: (productId: string): Promise<ProductReviewSummary> => {
    return fetchWithAuth<ProductReviewSummary>(`/products/${productId}/reviews`);
  },

  createReview: (productId: string, payload: CreateReviewPayload): Promise<Review> => {
    return fetchWithAuth<Review>(`/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  deleteReview: (reviewId: string): Promise<{ message: string }> => {
    return fetchWithAuth<{ message: string }>(`/reviews/${reviewId}`, {
      method: 'DELETE',
    });
  },
};
