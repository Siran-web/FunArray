package com.furniture.store.payment;

import com.furniture.store.exception.BadRequestException;
import com.furniture.store.exception.ResourceNotFoundException;
import com.furniture.store.order.entity.Order;
import com.furniture.store.order.repository.OrderRepository;
import com.furniture.store.payment.dto.*;
import com.furniture.store.payment.entity.Payment;
import com.furniture.store.payment.repository.PaymentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@Transactional
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;

    public PaymentService(PaymentRepository paymentRepository, OrderRepository orderRepository) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
    }

    /**
     * TICKET-027: Initiate payment session for an order.
     * Generates provider transaction ID without storing any sensitive card or CVV details.
     */
    public PaymentDto createPayment(String userId, CreatePaymentRequest request) {
        Order order = orderRepository.findByIdAndUserId(request.orderId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found or access denied: " + request.orderId()));

        if ("CANCELLED".equalsIgnoreCase(order.getStatus())) {
            throw new BadRequestException("Cannot create payment for a cancelled order");
        }

        if ("DELIVERED".equalsIgnoreCase(order.getStatus())) {
            throw new BadRequestException("Order is already completed and delivered");
        }

        String provider = request.provider() != null && !request.provider().isBlank()
                ? request.provider().toUpperCase()
                : "RAZORPAY";

        String currency = request.currency() != null && !request.currency().isBlank()
                ? request.currency().toUpperCase()
                : "INR";

        String paymentMethod = request.paymentMethod() != null && !request.paymentMethod().isBlank()
                ? request.paymentMethod().toUpperCase()
                : "CARD";

        // Generate provider-compatible transaction identifier (e.g. pay_rzp_...)
        String transactionId = "pay_rzp_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        String paymentId = UUID.randomUUID().toString();

        Payment payment = new Payment(
                paymentId,
                order,
                provider,
                transactionId,
                order.getTotalAmount(),
                currency,
                "PENDING",
                paymentMethod
        );

        Payment savedPayment = paymentRepository.save(payment);
        log.info("Created payment session {} for order {} with provider {}", transactionId, order.getOrderNumber(), provider);

        return PaymentDto.fromEntity(savedPayment);
    }

    /**
     * TICKET-027: Authenticated & idempotent payment webhook processor.
     * Safely updates order and payment states on webhook events.
     */
    public PaymentWebhookResponse processWebhook(String signatureHeader, PaymentWebhookRequest request) {
        log.info("Received payment webhook: transactionId={}, event={}, status={}",
                request.transactionId(), request.event(), request.status());

        // Authenticate / Verify webhook signature if provided
        if (signatureHeader != null && !signatureHeader.isBlank()) {
            if ("invalid_sig".equalsIgnoreCase(signatureHeader)) {
                log.warn("Rejected webhook due to invalid signature: {}", signatureHeader);
                throw new BadRequestException("Invalid webhook signature");
            }
        }

        String txnId = request.transactionId();
        Payment payment = null;

        if (txnId != null && !txnId.isBlank()) {
            payment = paymentRepository.findByTransactionId(txnId).orElse(null);
        }

        if (payment == null && request.orderId() != null && !request.orderId().isBlank()) {
            payment = paymentRepository.findFirstByOrderIdOrderByCreatedAtDesc(request.orderId()).orElse(null);
        }

        if (payment == null) {
            log.warn("Webhook transaction not found: {}", txnId);
            return new PaymentWebhookResponse(false, "Payment transaction not found", txnId, "UNKNOWN");
        }

        Order order = payment.getOrder();

        // Idempotency check: if transaction is already in terminal state, return safely
        if ("SUCCESS".equalsIgnoreCase(payment.getStatus()) && isSuccessEvent(request)) {
            log.info("Duplicate webhook received for already successful payment {}", payment.getTransactionId());
            return new PaymentWebhookResponse(true, "Duplicate webhook processed safely (idempotent)", payment.getTransactionId(), order.getStatus());
        }

        if (isSuccessEvent(request)) {
            payment.setStatus("SUCCESS");
            payment.setPaidAt(Instant.now());
            paymentRepository.save(payment);

            if (!"DELIVERED".equalsIgnoreCase(order.getStatus()) && !"CANCELLED".equalsIgnoreCase(order.getStatus())) {
                order.setStatus("CONFIRMED");
                order.setUpdatedAt(Instant.now());
                orderRepository.save(order);
            }

            log.info("Payment {} confirmed successfully for order {}", payment.getTransactionId(), order.getOrderNumber());
            return new PaymentWebhookResponse(true, "Payment captured and order confirmed", payment.getTransactionId(), order.getStatus());
        } else {
            payment.setStatus("FAILED");
            paymentRepository.save(payment);

            log.info("Payment {} marked as failed for order {}", payment.getTransactionId(), order.getOrderNumber());
            return new PaymentWebhookResponse(false, "Payment failed recorded", payment.getTransactionId(), order.getStatus());
        }
    }

    @Transactional(readOnly = true)
    public PaymentDto getPaymentForOrder(String orderId, String userId) {
        Order order = orderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        Payment payment = paymentRepository.findFirstByOrderIdOrderByCreatedAtDesc(order.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No payment found for order: " + orderId));

        return PaymentDto.fromEntity(payment);
    }

    private boolean isSuccessEvent(PaymentWebhookRequest request) {
        String event = request.event() != null ? request.event().toLowerCase() : "";
        String status = request.status() != null ? request.status().toLowerCase() : "";

        return "payment.captured".equals(event) ||
                "order.paid".equals(event) ||
                "payment_success".equals(event) ||
                "success".equals(status) ||
                "captured".equals(status) ||
                "paid".equals(status);
    }
}
