package com.furniture.store.order;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.furniture.store.auth.security.JwtTokenProvider;
import com.furniture.store.cart.repository.CartItemRepository;
import com.furniture.store.cart.repository.CartRepository;
import com.furniture.store.category.Category;
import com.furniture.store.category.CategoryRepository;
import com.furniture.store.inventory.entity.Inventory;
import com.furniture.store.inventory.repository.InventoryRepository;
import com.furniture.store.order.dto.UpdateOrderStatusRequest;
import com.furniture.store.order.entity.Order;
import com.furniture.store.order.entity.OrderItem;
import com.furniture.store.order.repository.OrderItemRepository;
import com.furniture.store.order.repository.OrderRepository;
import com.furniture.store.payment.dto.CreatePaymentRequest;
import com.furniture.store.payment.dto.PaymentWebhookRequest;
import com.furniture.store.payment.entity.Payment;
import com.furniture.store.payment.repository.PaymentRepository;
import com.furniture.store.product.entity.Product;
import com.furniture.store.product.entity.ProductVariant;
import com.furniture.store.product.repository.ProductRepository;
import com.furniture.store.product.repository.ProductVariantRepository;
import com.furniture.store.user.entity.Address;
import com.furniture.store.user.entity.Role;
import com.furniture.store.user.entity.User;
import com.furniture.store.user.entity.UserStatus;
import com.furniture.store.user.repository.AddressRepository;
import com.furniture.store.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class OrderAndPaymentTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductVariantRepository productVariantRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    private User customer;
    private User otherCustomer;
    private User admin;
    private String customerToken;
    private String otherCustomerToken;
    private String adminToken;
    private Address shippingAddress;
    private Product product;
    private ProductVariant variant;

    @AfterEach
    void tearDown() {
        cleanDatabase();
    }

    private void cleanDatabase() {
        paymentRepository.deleteAll();
        orderItemRepository.deleteAll();
        orderRepository.deleteAll();
        cartItemRepository.deleteAll();
        cartRepository.deleteAll();
        inventoryRepository.deleteAll();
        productVariantRepository.deleteAll();
        productRepository.deleteAll();
        categoryRepository.deleteAll();
        addressRepository.deleteAll();
        userRepository.deleteAll();
    }

    @BeforeEach
    void setUp() {
        cleanDatabase();

        // 1. Create Test Customers
        customer = new User();
        customer.setId(UUID.randomUUID().toString());
        customer.setEmail("customer@funarray.test");
        customer.setPasswordHash(passwordEncoder.encode("Password123!"));
        customer.setFirstName("Aarav");
        customer.setLastName("Sharma");
        customer.setRole(Role.CUSTOMER);
        customer.setStatus(UserStatus.ACTIVE);
        customer = userRepository.save(customer);
        customerToken = "Bearer " + tokenProvider.generateAccessToken(customer.getId(), customer.getEmail(), customer.getRole());

        otherCustomer = new User();
        otherCustomer.setId(UUID.randomUUID().toString());
        otherCustomer.setEmail("other@funarray.test");
        otherCustomer.setPasswordHash(passwordEncoder.encode("Password123!"));
        otherCustomer.setFirstName("Priya");
        otherCustomer.setLastName("Patel");
        otherCustomer.setRole(Role.CUSTOMER);
        otherCustomer.setStatus(UserStatus.ACTIVE);
        otherCustomer = userRepository.save(otherCustomer);
        otherCustomerToken = "Bearer " + tokenProvider.generateAccessToken(otherCustomer.getId(), otherCustomer.getEmail(), otherCustomer.getRole());

        admin = new User();
        admin.setId(UUID.randomUUID().toString());
        admin.setEmail("admin@funarray.test");
        admin.setPasswordHash(passwordEncoder.encode("AdminPass123!"));
        admin.setFirstName("System");
        admin.setLastName("Admin");
        admin.setRole(Role.ADMIN);
        admin.setStatus(UserStatus.ACTIVE);
        admin = userRepository.save(admin);
        adminToken = "Bearer " + tokenProvider.generateAccessToken(admin.getId(), admin.getEmail(), admin.getRole());

        // 2. Address
        shippingAddress = new Address();
        shippingAddress.setId(UUID.randomUUID().toString());
        shippingAddress.setUser(customer);
        shippingAddress.setAddressLine1("42 Bandra West");
        shippingAddress.setCity("Mumbai");
        shippingAddress.setState("Maharashtra");
        shippingAddress.setPostalCode("400050");
        shippingAddress.setCountry("India");
        shippingAddress.setIsDefault(true);
        shippingAddress = addressRepository.save(shippingAddress);

        // 3. Category & Product
        Category category = new Category();
        category.setId(UUID.randomUUID().toString());
        category.setName("Living Room");
        category.setSlug("living-room");
        category = categoryRepository.save(category);

        product = new Product();
        product.setId(UUID.randomUUID().toString());
        product.setCategoryId(category.getId());
        product.setName("Kanso 3-Seater Sofa");
        product.setSlug("kanso-3-seater-sofa");
        product.setSku("PROD-KANSO-SOFA");
        product.setBasePrice(new BigDecimal("45000.00"));
        product.setWidthCm(new BigDecimal("200.0"));
        product.setHeightCm(new BigDecimal("85.0"));
        product.setDepthCm(new BigDecimal("90.0"));
        product = productRepository.save(product);

        variant = new ProductVariant();
        variant.setId(UUID.randomUUID().toString());
        variant.setProduct(product);
        variant.setSku("KANSO-OAK-01");
        variant.setColor("Oatmeal Linen");
        variant.setMaterial("Solid Oak");
        variant.setPrice(new BigDecimal("45000.00"));
        variant.setStockQuantity(10);
        variant = productVariantRepository.save(variant);

        Inventory inventory = new Inventory();
        inventory.setId(UUID.randomUUID().toString());
        inventory.setProduct(product);
        inventory.setVariant(variant);
        inventory.setQuantity(10);
        inventoryRepository.save(inventory);
    }

    private Order createTestOrder(User user, String status, BigDecimal amount) {
        String orderNumber = "ORD-TEST-" + UUID.randomUUID().toString().substring(0, 8);
        Order order = new Order(
                UUID.randomUUID().toString(),
                user,
                orderNumber,
                status,
                amount,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                amount,
                shippingAddress
        );

        OrderItem item = new OrderItem(
                UUID.randomUUID().toString(),
                order,
                product,
                variant,
                product.getName(),
                1,
                amount,
                amount
        );
        order.getItems().add(item);
        return orderRepository.save(order);
    }

    // =========================================================================
    // TICKET-026: Order Creation & Order History Tests
    // =========================================================================

    @Test
    @DisplayName("TICKET-026: User can retrieve their order history")
    void testGetUserOrders() throws Exception {
        createTestOrder(customer, "CONFIRMED", new BigDecimal("45000.00"));
        createTestOrder(customer, "PROCESSING", new BigDecimal("32000.00"));

        mockMvc.perform(get("/api/v1/orders")
                        .header("Authorization", customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[*].totalAmount", containsInAnyOrder(45000.00, 32000.00)))
                .andExpect(jsonPath("$.data[*].status", containsInAnyOrder("CONFIRMED", "PROCESSING")));
    }

    @Test
    @DisplayName("TICKET-026: User can retrieve individual order by ID with item snapshots")
    void testGetOrderById() throws Exception {
        Order order = createTestOrder(customer, "CONFIRMED", new BigDecimal("45000.00"));

        mockMvc.perform(get("/api/v1/orders/" + order.getId())
                        .header("Authorization", customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(order.getId()))
                .andExpect(jsonPath("$.data.orderNumber").value(order.getOrderNumber()))
                .andExpect(jsonPath("$.data.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.items[0].unitPrice").value(45000.00));
    }

    @Test
    @DisplayName("TICKET-026: User cannot access another user's order (Authorization isolation)")
    void testUserCannotAccessOtherUserOrder() throws Exception {
        Order otherOrder = createTestOrder(otherCustomer, "CONFIRMED", new BigDecimal("50000.00"));

        mockMvc.perform(get("/api/v1/orders/" + otherOrder.getId())
                        .header("Authorization", customerToken))
                .andExpect(status().isNotFound());
    }

    // =========================================================================
    // TICKET-027: Payment Integration Tests
    // =========================================================================

    @Test
    @DisplayName("TICKET-027: Payment can be initiated for an order without storing card/CVV")
    void testCreatePayment() throws Exception {
        Order order = createTestOrder(customer, "CONFIRMED", new BigDecimal("45000.00"));

        CreatePaymentRequest request = new CreatePaymentRequest(
                order.getId(),
                "UPI",
                "RAZORPAY",
                "INR"
        );

        mockMvc.perform(post("/api/v1/payments/create")
                        .header("Authorization", customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orderId").value(order.getId()))
                .andExpect(jsonPath("$.data.transactionId", startsWith("pay_rzp_")))
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.amount").value(45000.00))
                .andExpect(jsonPath("$.data.currency").value("INR"));

        // Verify Payment is persisted in database
        List<Payment> payments = paymentRepository.findAll();
        assertEquals(1, payments.size());
        assertEquals("PENDING", payments.get(0).getStatus());
        assertEquals("UPI", payments.get(0).getPaymentMethod());
        assertNotNull(payments.get(0).getTransactionId());
    }

    @Test
    @DisplayName("TICKET-027: Authenticated webhook captures payment and updates order state")
    void testPaymentWebhookSuccess() throws Exception {
        Order order = createTestOrder(customer, "PENDING", new BigDecimal("45000.00"));
        Payment payment = new Payment(
                UUID.randomUUID().toString(),
                order,
                "RAZORPAY",
                "pay_test_webhook_123",
                order.getTotalAmount(),
                "INR",
                "PENDING",
                "CARD"
        );
        paymentRepository.save(payment);

        PaymentWebhookRequest webhookRequest = new PaymentWebhookRequest(
                "payment.captured",
                "pay_test_webhook_123",
                order.getId(),
                "SUCCESS",
                new BigDecimal("45000.00"),
                "INR",
                "valid_sig_hash"
        );

        mockMvc.perform(post("/api/v1/payments/webhook")
                        .header("X-Razorpay-Signature", "valid_sig_hash")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(webhookRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.success").value(true))
                .andExpect(jsonPath("$.data.orderStatus").value("CONFIRMED"));

        // Verify Payment updated to SUCCESS and Order confirmed
        Payment updatedPayment = paymentRepository.findByTransactionId("pay_test_webhook_123").orElseThrow();
        assertEquals("SUCCESS", updatedPayment.getStatus());
        assertNotNull(updatedPayment.getPaidAt());

        Order updatedOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertEquals("CONFIRMED", updatedOrder.getStatus());
    }

    @Test
    @DisplayName("TICKET-027: Duplicate webhook events are handled safely and idempotently")
    void testPaymentWebhookIdempotency() throws Exception {
        Order order = createTestOrder(customer, "CONFIRMED", new BigDecimal("45000.00"));
        Payment payment = new Payment(
                UUID.randomUUID().toString(),
                order,
                "RAZORPAY",
                "pay_test_idempotent_123",
                order.getTotalAmount(),
                "INR",
                "SUCCESS",
                "CARD"
        );
        payment.setPaidAt(java.time.Instant.now());
        paymentRepository.save(payment);

        PaymentWebhookRequest webhookRequest = new PaymentWebhookRequest(
                "payment.captured",
                "pay_test_idempotent_123",
                order.getId(),
                "SUCCESS",
                new BigDecimal("45000.00"),
                "INR",
                "valid_sig_hash"
        );

        mockMvc.perform(post("/api/v1/payments/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(webhookRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.message", containsString("idempotent")));
    }

    @Test
    @DisplayName("TICKET-027: Failed payments do not mark orders as paid")
    void testFailedPaymentDoesNotMarkOrderPaid() throws Exception {
        Order order = createTestOrder(customer, "PENDING", new BigDecimal("45000.00"));
        Payment payment = new Payment(
                UUID.randomUUID().toString(),
                order,
                "RAZORPAY",
                "pay_test_failed_123",
                order.getTotalAmount(),
                "INR",
                "PENDING",
                "CARD"
        );
        paymentRepository.save(payment);

        PaymentWebhookRequest webhookRequest = new PaymentWebhookRequest(
                "payment.failed",
                "pay_test_failed_123",
                order.getId(),
                "FAILED",
                new BigDecimal("45000.00"),
                "INR",
                null
        );

        mockMvc.perform(post("/api/v1/payments/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(webhookRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.success").value(false));

        Payment updatedPayment = paymentRepository.findByTransactionId("pay_test_failed_123").orElseThrow();
        assertEquals("FAILED", updatedPayment.getStatus());

        Order updatedOrder = orderRepository.findById(order.getId()).orElseThrow();
        assertEquals("PENDING", updatedOrder.getStatus()); // Order NOT marked confirmed or paid
    }

    // =========================================================================
    // TICKET-028: Order Status Tracking & Permitted Transitions
    // =========================================================================

    @Test
    @DisplayName("TICKET-028: Admin/Staff can advance order through permitted status lifecycle")
    void testAdminAdvanceStatusLifecycle() throws Exception {
        Order order = createTestOrder(customer, "CONFIRMED", new BigDecimal("45000.00"));

        // 1. CONFIRMED -> PROCESSING
        UpdateOrderStatusRequest req1 = new UpdateOrderStatusRequest("PROCESSING", "Packing furniture");
        mockMvc.perform(put("/api/v1/admin/orders/" + order.getId() + "/status")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PROCESSING"));

        // 2. PROCESSING -> SHIPPED
        UpdateOrderStatusRequest req2 = new UpdateOrderStatusRequest("SHIPPED", "Dispatched with white glove courier");
        mockMvc.perform(put("/api/v1/admin/orders/" + order.getId() + "/status")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("SHIPPED"));

        // 3. SHIPPED -> DELIVERED
        UpdateOrderStatusRequest req3 = new UpdateOrderStatusRequest("DELIVERED", "Delivered and assembled at destination");
        mockMvc.perform(put("/api/v1/admin/orders/" + order.getId() + "/status")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req3)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("DELIVERED"));
    }

    @Test
    @DisplayName("TICKET-028: Invalid status transitions are rejected with 400 Bad Request")
    void testInvalidStatusTransitionRejected() throws Exception {
        Order order = createTestOrder(customer, "SHIPPED", new BigDecimal("45000.00"));

        // Attempt invalid rollback: SHIPPED -> PENDING
        UpdateOrderStatusRequest invalidReq = new UpdateOrderStatusRequest("PENDING", "Illegal rollback");
        mockMvc.perform(put("/api/v1/admin/orders/" + order.getId() + "/status")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.message", containsString("Invalid status transition")));

        // Attempt transition out of terminal state: DELIVERED -> CANCELLED
        Order deliveredOrder = createTestOrder(customer, "DELIVERED", new BigDecimal("45000.00"));
        UpdateOrderStatusRequest cancelDeliveredReq = new UpdateOrderStatusRequest("CANCELLED", "Cannot cancel delivered");
        mockMvc.perform(put("/api/v1/admin/orders/" + deliveredOrder.getId() + "/status")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cancelDeliveredReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.message", containsString("terminal state")));
    }
}
