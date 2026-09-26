package com.furniture.store.cart.dto;

import java.math.BigDecimal;

public record CartItemDto(
        String id,
        String productId,
        String productName,
        String productSlug,
        String variantId,
        String variantSku,
        String variantColor,
        String variantMaterial,
        String imageUrl,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal totalPrice
) {}
