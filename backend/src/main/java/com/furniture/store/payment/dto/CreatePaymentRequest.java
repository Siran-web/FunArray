package com.furniture.store.payment.dto;

import jakarta.validation.constraints.NotBlank;

public record CreatePaymentRequest(
        @NotBlank(message = "Order ID is required")
        String orderId,
        String paymentMethod,
        String provider,
        String currency
) {}
