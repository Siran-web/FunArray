package com.furniture.store.review.dto;

import java.util.List;
import java.util.Map;

public record ProductReviewSummaryDto(
        double averageRating,
        int totalReviews,
        Map<Integer, Long> ratingDistribution,
        List<ReviewDto> reviews
) {}
