package com.furniture.store.payment.dto;

public record PaymentWebhookResponse(
        boolean success,
        String message,
        String transactionId,
        String orderStatus
) {}
