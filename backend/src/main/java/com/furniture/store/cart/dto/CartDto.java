package com.furniture.store.cart.dto;

import java.math.BigDecimal;
import java.util.List;

public record CartDto(
        String id,
        String userId,
        String status,
        List<CartItemDto> items,
        Integer totalItems,
        BigDecimal subtotal
) {}
