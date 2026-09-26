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
        Instant createdAt,
        Instant updatedAt
) {}
