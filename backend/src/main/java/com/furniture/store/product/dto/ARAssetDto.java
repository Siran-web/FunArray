package com.furniture.store.product.dto;

import java.math.BigDecimal;

public record ARAssetDto(
        boolean supported,
        String modelUrl,
        String thumbnailUrl,
        Dimensions dimensions
) {
    public record Dimensions(
            BigDecimal width,
            BigDecimal height,
            BigDecimal depth,
            String unit
    ) {}
}
