package com.furniture.store.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddProductImageRequest(
        @NotBlank(message = "Image URL is required")
        String imageUrl,

        @Size(max = 255, message = "Alt text must not exceed 255 characters")
        String altText,

        Integer sortOrder,

        Boolean isPrimary
) {}
