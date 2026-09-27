package com.furniture.store.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateReviewRequest(
        @Min(value = 1, message = "Rating must be at least 1")
        @Max(value = 5, message = "Rating cannot exceed 5")
        int rating,

        @NotBlank(message = "Review title is required")
        @Size(max = 255, message = "Review title cannot exceed 255 characters")
        String title,

        @NotBlank(message = "Review comment is required")
        String comment
) {}
