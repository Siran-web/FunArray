package com.furniture.store.category.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCategoryRequest(
        @NotBlank(message = "Category name is required")
        @Size(max = 100, message = "Category name must not exceed 100 characters")
        String name,

        @Size(max = 120, message = "Slug must not exceed 120 characters")
        String slug,

        String description,

        @Size(max = 500, message = "Image URL must not exceed 500 characters")
        String imageUrl,

        String parentId,

        Integer sortOrder
) {}
