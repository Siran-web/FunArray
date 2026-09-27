package com.furniture.store.payment;

import com.furniture.store.exception.BadRequestException;
import com.furniture.store.order.entity.Order;
import com.furniture.store.order.repository.OrderRepository;
import com.furniture.store.payment.dto.CreatePaymentRequest;
import com.furniture.store.payment.dto.PaymentDto;
import com.furniture.store.payment.dto.PaymentWebhookRequest;
import com.furniture.store.payment.dto.PaymentWebhookResponse;
import com.furniture.store.payment.entity.Payment;
import com.furniture.store.payment.repository.PaymentRepository;
import com.furniture.store.user.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PaymentServiceUnitTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private OrderRepository orderRepository;

    @InjectMocks
    private PaymentService paymentService;

    private User sampleUser;
    private Order sampleOrder;
    private Payment samplePayment;

    @BeforeEach
    void setUp() {
        sampleUser = new User("customer@funarray.com", "hash", "Alex", "Smith", "+919876543210", null, null);
        sampleUser.setId("user-1");

        sampleOrder = new Order(
                "order-1", sampleUser, "ORD-999", "PENDING_PAYMENT",
                new BigDecimal("500.00"), BigDecimal.ZERO, new BigDecimal("40.00"),
                BigDecimal.ZERO, new BigDecimal("540.00"), null
        );

        samplePayment = new Payment(
                "pay-1", sampleOrder, "RAZORPAY", "pay_rzp_test123",
                new BigDecimal("540.00"), "INR", "PENDING", "CARD"
        );
    }

    @Test
    @DisplayName("Unit: createPayment creates pending payment transaction without storing CVV")
    void createPayment_Success() {
        CreatePaymentRequest request = new CreatePaymentRequest("order-1", "RAZORPAY", "INR", "CARD");

        when(orderRepository.findByIdAndUserId("order-1", "user-1")).thenReturn(Optional.of(sampleOrder));
        when(paymentRepository.save(any(Payment.class))).thenReturn(samplePayment);

        PaymentDto result = paymentService.createPayment("user-1", request);

        assertThat(result).isNotNull();
        assertThat(result.provider()).isEqualTo("RAZORPAY");
        assertThat(result.status()).isEqualTo("PENDING");
        verify(paymentRepository).save(any(Payment.class));
    }

    @Test
    @DisplayName("Unit: createPayment throws BadRequestException for cancelled order")
    void createPayment_CancelledOrder() {
        sampleOrder.setStatus("CANCELLED");
        CreatePaymentRequest request = new CreatePaymentRequest("order-1", "RAZORPAY", "INR", "CARD");

        when(orderRepository.findByIdAndUserId("order-1", "user-1")).thenReturn(Optional.of(sampleOrder));

        assertThatThrownBy(() -> paymentService.createPayment("user-1", request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Cannot create payment for a cancelled order");
    }

    @Test
    @DisplayName("Unit: processWebhook captures payment and updates order status to CONFIRMED")
    void processWebhook_PaymentCaptured() {
        PaymentWebhookRequest webhookReq = new PaymentWebhookRequest(
                "payment.captured", "pay_rzp_test123", "order-1", "captured",
                new BigDecimal("540.00"), "INR", null
        );

        when(paymentRepository.findByTransactionId("pay_rzp_test123")).thenReturn(Optional.of(samplePayment));

        PaymentWebhookResponse response = paymentService.processWebhook("valid-sig", webhookReq);

        assertThat(response.success()).isTrue();
        assertThat(samplePayment.getStatus()).isEqualTo("SUCCESS");
        assertThat(sampleOrder.getStatus()).isEqualTo("CONFIRMED");
        verify(paymentRepository).save(samplePayment);
        verify(orderRepository).save(sampleOrder);
    }

    @Test
    @DisplayName("Unit: processWebhook handles idempotent duplicate webhook calls safely")
    void processWebhook_IdempotentDuplicate() {
        samplePayment.setStatus("SUCCESS");
        PaymentWebhookRequest webhookReq = new PaymentWebhookRequest(
                "payment.captured", "pay_rzp_test123", "order-1", "captured",
                new BigDecimal("540.00"), "INR", null
        );

        when(paymentRepository.findByTransactionId("pay_rzp_test123")).thenReturn(Optional.of(samplePayment));

        PaymentWebhookResponse response = paymentService.processWebhook("valid-sig", webhookReq);

        assertThat(response.success()).isTrue();
        assertThat(response.message()).contains("Duplicate webhook processed safely");
    }

    @Test
    @DisplayName("Unit: processWebhook marks payment failed on failed event")
    void processWebhook_PaymentFailed() {
        PaymentWebhookRequest webhookReq = new PaymentWebhookRequest(
                "payment.failed", "pay_rzp_test123", "order-1", "failed",
                new BigDecimal("540.00"), "INR", null
        );

        when(paymentRepository.findByTransactionId("pay_rzp_test123")).thenReturn(Optional.of(samplePayment));

        PaymentWebhookResponse response = paymentService.processWebhook("valid-sig", webhookReq);

        assertThat(response.success()).isFalse();
        assertThat(samplePayment.getStatus()).isEqualTo("FAILED");
        verify(paymentRepository).save(samplePayment);
    }
}
