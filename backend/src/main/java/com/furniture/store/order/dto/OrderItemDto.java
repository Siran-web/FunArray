package com.furniture.store.order.dto;

import java.math.BigDecimal;

public record OrderItemDto(
        String id,
        String productId,
        String productName,
        String productSlug,
        String variantId,
        String sku,
        String color,
        String material,
        String imageUrl,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal totalPrice
) {}
