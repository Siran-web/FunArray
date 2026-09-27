package com.furniture.store.payment.dto;

import com.furniture.store.payment.entity.Payment;
import java.math.BigDecimal;
import java.time.Instant;

public record PaymentDto(
        String id,
        String orderId,
        String orderNumber,
        String provider,
        String transactionId,
        BigDecimal amount,
        String currency,
        String status,
        String paymentMethod,
        Instant paidAt,
        Instant createdAt
) {
    public static PaymentDto fromEntity(Payment payment) {
        if (payment == null) return null;
        return new PaymentDto(
                payment.getId(),
                payment.getOrder() != null ? payment.getOrder().getId() : null,
                payment.getOrder() != null ? payment.getOrder().getOrderNumber() : null,
                payment.getProvider(),
                payment.getTransactionId(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getStatus(),
                payment.getPaymentMethod(),
                payment.getPaidAt(),
                payment.getCreatedAt()
        );
    }
}
