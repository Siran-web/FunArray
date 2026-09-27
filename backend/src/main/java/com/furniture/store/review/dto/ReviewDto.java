package com.furniture.store.review.dto;

import java.time.Instant;

public record ReviewDto(
        String id,
        String productId,
        String productName,
        String userId,
        String userName,
        int rating,
        String title,
        String comment,
        String status,
        Instant createdAt
) {}
