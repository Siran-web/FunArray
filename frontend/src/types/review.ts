export interface Review {
  id: string;
  productId: string;
  productName?: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  status: 'PUBLISHED' | 'PENDING' | 'REJECTED';
  createdAt: string;
}

export interface ProductReviewSummary {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  reviews: Review[];
}

export interface CreateReviewPayload {
  rating: number;
  title: string;
  comment: string;
}
