package com.furniture.store.order.dto;

import com.furniture.store.user.dto.AddressDto;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderDto(
        String id,
        String orderNumber,
        String status,
        BigDecimal subtotal,
        BigDecimal shippingFee,
        BigDecimal tax,
        BigDecimal discount,
        BigDecimal totalAmount,
        AddressDto shippingAddress,
        List<OrderItemDto> items,
        String customerName,
        String customerEmail,
        String customerPhone,
        String paymentStatus,
        String paymentMethod,
        Instant createdAt,
        Instant updatedAt
) {
    public OrderDto(
            String id,
            String orderNumber,
            String status,
            BigDecimal subtotal,
            BigDecimal shippingFee,
            BigDecimal tax,
            BigDecimal discount,
            BigDecimal totalAmount,
            AddressDto shippingAddress,
            List<OrderItemDto> items,
            Instant createdAt,
            Instant updatedAt
    ) {
        this(
                id,
                orderNumber,
                status,
                subtotal,
                shippingFee,
                tax,
                discount,
                totalAmount,
                shippingAddress,
                items,
                null,
                null,
                null,
                "PAID",
                "CREDIT_CARD",
                createdAt,
                updatedAt
        );
    }
}

