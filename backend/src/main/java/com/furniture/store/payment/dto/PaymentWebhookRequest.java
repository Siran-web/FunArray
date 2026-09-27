package com.furniture.store.payment.dto;

import java.math.BigDecimal;

public record PaymentWebhookRequest(
        String event,
        String transactionId,
        String orderId,
        String status,
        BigDecimal amount,
        String currency,
        String signature
) {}
