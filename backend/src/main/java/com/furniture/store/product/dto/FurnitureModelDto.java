package com.furniture.store.product.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record FurnitureModelDto(
        String id,
        String productId,
        String modelUrl,
        String thumbnailUrl,
        String format,
        Long fileSize,
        BigDecimal widthCm,
        BigDecimal heightCm,
        BigDecimal depthCm,
        Integer version,
        String status,
        Instant createdAt,
        Instant updatedAt
) {}
