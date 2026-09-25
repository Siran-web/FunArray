package com.furniture.store.product.dto;

import java.math.BigDecimal;

public record ProductSummaryDto(
        String id,
        String name,
        String slug,
        BigDecimal price,
        String category,
        String thumbnail,
        double rating,
        boolean available,
        boolean arSupported
) {}
