package com.furniture.store.category.dto;

import java.time.Instant;
import java.util.List;

public record CategoryDto(
        String id,
        String name,
        String slug,
        String description,
        String imageUrl,
        String parentId,
        Integer sortOrder,
        Instant createdAt,
        Instant updatedAt,
        List<CategoryDto> children
) {
    public CategoryDto(String id, String name, String slug, String description, String imageUrl, String parentId, Integer sortOrder, Instant createdAt, Instant updatedAt) {
        this(id, name, slug, description, imageUrl, parentId, sortOrder, createdAt, updatedAt, null);
    }
}
