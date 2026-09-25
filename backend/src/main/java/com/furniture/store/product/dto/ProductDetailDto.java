package com.furniture.store.product.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record ProductDetailDto(
        String id,
        String name,
        String slug,
        String description,
        String brand,
        BigDecimal basePrice,
        String material,
        DimensionsDto dimensions,
        String sku,
        String categoryId,
        String categoryName,
        double rating,
        int reviewCount,
        boolean available,
        boolean arSupported,
        List<ProductImageDto> images,
        List<ProductVariantDto> variants,
        ARAssetDto model3D,
        Map<String, String> storeAvailability
) {
    public record DimensionsDto(
            BigDecimal widthCm,
            BigDecimal heightCm,
            BigDecimal depthCm,
            String unit
    ) {}

    public record ProductImageDto(
            String id,
            String imageUrl,
            String altText,
            int sortOrder,
            boolean isPrimary
    ) {}

    public record ProductVariantDto(
            String id,
            String sku,
            String color,
            String material,
            BigDecimal price,
            int stockQuantity
    ) {}
}
