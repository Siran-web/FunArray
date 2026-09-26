package com.furniture.store.order.dto;

import com.furniture.store.cart.dto.CartItemDto;
import com.furniture.store.user.dto.AddressDto;
import java.math.BigDecimal;
import java.util.List;

public record CheckoutPreviewResponse(
        List<CartItemDto> items,
        int totalItems,
        BigDecimal subtotal,
        BigDecimal shippingFee,
        BigDecimal tax,
        BigDecimal discount,
        BigDecimal totalAmount,
        AddressDto shippingAddress,
        boolean eligibleForFreeShipping,
        BigDecimal freeShippingThreshold
) {}
