package com.furniture.store.order.dto;

import jakarta.validation.constraints.NotBlank;

public record CheckoutRequest(
        @NotBlank(message = "Shipping address is required")
        String shippingAddressId,
        String paymentMethod,
        String notes,
        String couponCode
) {}
