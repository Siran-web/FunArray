package com.furniture.store.payment;

import com.furniture.store.auth.security.UserPrincipal;
import com.furniture.store.common.ApiResponse;
import com.furniture.store.payment.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/payments", "/api/payments"})
@Tag(name = "Payments", description = "Payment initiation and webhook processing")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/create")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Initiate a payment transaction for an order (TICKET-027)")
    public ResponseEntity<ApiResponse<PaymentDto>> createPayment(
            @Valid @RequestBody CreatePaymentRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        PaymentDto payment = paymentService.createPayment(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.ok(payment));
    }

    @PostMapping("/webhook")
    @Operation(summary = "Handle incoming payment provider webhook events (TICKET-027)")
    public ResponseEntity<ApiResponse<PaymentWebhookResponse>> handleWebhook(
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String razorpaySignature,
            @RequestHeader(value = "X-Webhook-Signature", required = false) String customSignature,
            @RequestBody PaymentWebhookRequest request
    ) {
        String signature = razorpaySignature != null ? razorpaySignature : customSignature;
        PaymentWebhookResponse response = paymentService.processWebhook(signature, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/order/{orderId}")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get payment transaction details for an order")
    public ResponseEntity<ApiResponse<PaymentDto>> getPaymentForOrder(
            @PathVariable String orderId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        PaymentDto payment = paymentService.getPaymentForOrder(orderId, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(payment));
    }
}
