package com.furniture.store.e2e;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.furniture.store.auth.dto.LoginRequest;
import com.furniture.store.auth.dto.RegisterRequest;
import com.furniture.store.cart.dto.AddToCartRequest;
import com.furniture.store.cart.repository.CartItemRepository;
import com.furniture.store.cart.repository.CartRepository;
import com.furniture.store.category.Category;
import com.furniture.store.category.CategoryRepository;
import com.furniture.store.inventory.entity.Inventory;
import com.furniture.store.inventory.repository.InventoryRepository;
import com.furniture.store.order.dto.CheckoutRequest;
import com.furniture.store.order.repository.OrderItemRepository;
import com.furniture.store.order.repository.OrderRepository;
import com.furniture.store.payment.dto.CreatePaymentRequest;
import com.furniture.store.payment.dto.PaymentWebhookRequest;
import com.furniture.store.payment.repository.PaymentRepository;
import com.furniture.store.product.entity.Product;
import com.furniture.store.product.entity.ProductVariant;
import com.furniture.store.product.repository.ProductRepository;
import com.furniture.store.product.repository.ProductVariantRepository;
import com.furniture.store.user.entity.Address;
import com.furniture.store.user.entity.User;
import com.furniture.store.user.repository.AddressRepository;
import com.furniture.store.user.repository.UserRepository;
import com.furniture.store.visualization.repository.RoomImageRepository;
import com.furniture.store.visualization.repository.VisualizationSessionRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class CriticalCustomerJourneyE2ETest {

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
    private RoomImageRepository roomImageRepository;

    @Autowired
    private VisualizationSessionRepository visualizationSessionRepository;

    private Category seededCategory;
    private Product seededProduct;
    private ProductVariant seededVariant;

    @BeforeEach
    void setUp() {
        cleanUpAllData();

        // 1. Seed Category
        seededCategory = new Category();
        seededCategory.setId(UUID.randomUUID().toString());
        seededCategory.setName("Architectural Living");
        seededCategory.setSlug("architectural-living-" + UUID.randomUUID());
        seededCategory = categoryRepository.save(seededCategory);

        // 2. Seed Product
        seededProduct = new Product();
        seededProduct.setId(UUID.randomUUID().toString());
        seededProduct.setCategoryId(seededCategory.getId());
        seededProduct.setName("Nordic Solid Walnut Lounge Chair");
        seededProduct.setSlug("nordic-walnut-lounge-chair-" + UUID.randomUUID());
        seededProduct.setDescription("Hand-finished solid American walnut lounge chair with genuine top-grain leather.");
        seededProduct.setBrand("FunArray Studio");
        seededProduct.setMaterial("American Walnut & Top-Grain Leather");
        seededProduct.setBasePrice(new BigDecimal("42000.00"));
        seededProduct.setSku("FNA-WLN-001");
        seededProduct.setWidthCm(new BigDecimal("82.0"));
        seededProduct.setHeightCm(new BigDecimal("78.0"));
        seededProduct.setDepthCm(new BigDecimal("86.0"));
        seededProduct = productRepository.save(seededProduct);

        // 3. Seed Variant
        seededVariant = new ProductVariant();
        seededVariant.setId(UUID.randomUUID().toString());
        seededVariant.setProduct(seededProduct);
        seededVariant.setSku("FNA-WLN-001-COGNAC");
        seededVariant.setColor("Cognac Leather");
        seededVariant.setMaterial("American Walnut & Cognac Leather");
        seededVariant.setPrice(new BigDecimal("42000.00"));
        seededVariant.setStockQuantity(15);
        seededVariant = productVariantRepository.save(seededVariant);

        // 4. Seed Inventory Record
        Inventory inventory = new Inventory();
        inventory.setId(UUID.randomUUID().toString());
        inventory.setProduct(seededProduct);
        inventory.setVariant(seededVariant);
        inventory.setQuantity(15);
        inventoryRepository.save(inventory);
    }

    @AfterEach
    void tearDown() {
        cleanUpAllData();
    }

    private void cleanUpAllData() {
        paymentRepository.deleteAll();
        orderItemRepository.deleteAll();
        orderRepository.deleteAll();
        cartItemRepository.deleteAll();
        cartRepository.deleteAll();
        visualizationSessionRepository.deleteAll();
        roomImageRepository.deleteAll();
        inventoryRepository.deleteAll();
        productVariantRepository.deleteAll();
        productRepository.deleteAll();
        categoryRepository.deleteAll();
        addressRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    @DisplayName("Complete Customer Core Loop: Register → Login → Browse → Product Details → View in Room → Save Session → Add to Cart → Checkout → Order → Payment")
    void testCompleteCustomerJourneyFlow() throws Exception {
        // ==========================================
        // STEP 1: Customer Registration (Register)
        // ==========================================
        String customerEmail = "customer." + UUID.randomUUID() + "@funarray.store";
        RegisterRequest registerReq = new RegisterRequest(
                customerEmail,
                "Password@123",
                "Aarav",
                "Mehta",
                "+919876543210"
        );

        MvcResult registerResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.user.email").value(customerEmail))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andReturn();

        // ==========================================
        // STEP 2: Customer Login & Token Issuance (Login)
        // ==========================================
        LoginRequest loginReq = new LoginRequest(customerEmail, "Password@123");

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                .andReturn();

        String responseBody = loginResult.getResponse().getContentAsString();
        JsonNode rootNode = objectMapper.readTree(responseBody);
        String jwtToken = rootNode.path("data").path("accessToken").asText();
        String userId = rootNode.path("data").path("user").path("id").asText();
        assertNotNull(jwtToken, "Access token must not be null");

        // Create Address for user
        User user = userRepository.findById(userId).orElseThrow();
        Address address = new Address();
        address.setId(UUID.randomUUID().toString());
        address.setUser(user);
        address.setAddressLine1("Penthouse 4B, Sky Towers, Golf Course Road");
        address.setCity("Gurugram");
        address.setState("Haryana");
        address.setPostalCode("122002");
        address.setCountry("India");
        address.setIsDefault(true);
        address = addressRepository.save(address);

        // ==========================================
        // STEP 3: Browse Catalog & Filter (Browse)
        // ==========================================
        mockMvc.perform(get("/api/v1/products")
                        .header("Authorization", "Bearer " + jwtToken)
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data.content[0].name").value("Nordic Solid Walnut Lounge Chair"));

        // ==========================================
        // STEP 4: Product Detail Inspection (Product Details)
        // ==========================================
        mockMvc.perform(get("/api/v1/products/" + seededProduct.getId())
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(seededProduct.getId()))
                .andExpect(jsonPath("$.data.arSupported").value(true))
                .andExpect(jsonPath("$.data.variants", hasSize(1)))
                .andExpect(jsonPath("$.data.variants[0].sku").value("FNA-WLN-001-COGNAC"));

        // ==========================================
        // STEP 5: Register Room Image (View in My Room)
        // ==========================================
        String roomPayload = """
                {
                  "name": "My Penthouse Living Space",
                  "imageUrl": "https://funarray.store/uploads/living-room-mock.jpg"
                }
                """;

        MvcResult uploadResult = mockMvc.perform(post("/api/v1/rooms")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(roomPayload)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").isNotEmpty())
                .andReturn();

        String roomUploadJson = uploadResult.getResponse().getContentAsString();
        String roomImageId = objectMapper.readTree(roomUploadJson).path("data").path("id").asText();

        // ==========================================
        // STEP 6: Create Visualization Session & Place Furniture (Add Furniture & Transform)
        // ==========================================
        String scenePayload = """
                {
                  "name": "Mid-Century Living Layout",
                  "roomImageId": "%s",
                  "roomImageUrl": "https://funarray.store/uploads/living-room-mock.jpg",
                  "sceneData": "{\\"furniture\\":[{\\"productId\\":\\"%s\\",\\"position\\":[1.2,0.0,-2.5],\\"rotation\\":[0,1.57,0],\\"scale\\":[1,1,1]}]}"
                }
                """.formatted(roomImageId, seededProduct.getId());

        MvcResult sessionResult = mockMvc.perform(post("/api/v1/designs")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(scenePayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").isNotEmpty())
                .andExpect(jsonPath("$.data.name").value("Mid-Century Living Layout"))
                .andReturn();

        String sessionId = objectMapper.readTree(sessionResult.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // Verify visualization persistence
        mockMvc.perform(get("/api/v1/designs/" + sessionId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.sceneData").value(containsString(seededProduct.getId())));

        // ==========================================
        // STEP 7: Add Product & Variant to Cart (Add to Cart)
        // ==========================================
        AddToCartRequest addToCartReq = new AddToCartRequest(
                seededProduct.getId(),
                seededVariant.getId(),
                2 // Customer decides to order 2 chairs
        );

        mockMvc.perform(post("/api/v1/cart/items")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addToCartReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.items[0].quantity").value(2))
                .andExpect(jsonPath("$.data.subtotal").value(84000.00));

        // ==========================================
        // STEP 8: Checkout & Create Order (Checkout → Order)
        // ==========================================
        CheckoutRequest checkoutReq = new CheckoutRequest(
                address.getId(),
                "UPI",
                "Please deliver during morning hours",
                null
        );

        MvcResult checkoutResult = mockMvc.perform(post("/api/v1/checkout")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.orderNumber").isNotEmpty())
                .andExpect(jsonPath("$.data.subtotal").value(84000.00))
                .andExpect(jsonPath("$.data.totalAmount").value(90720.00))
                .andExpect(jsonPath("$.data.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andReturn();

        String orderJson = checkoutResult.getResponse().getContentAsString();
        String orderId = objectMapper.readTree(orderJson).path("data").path("id").asText();

        // Verify cart is cleared after checkout
        mockMvc.perform(get("/api/v1/cart")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items", hasSize(0)))
                .andExpect(jsonPath("$.data.subtotal").value(0.00));

        // ==========================================
        // STEP 9: Payment Processing & Confirmation (Payment)
        // ==========================================
        CreatePaymentRequest paymentReq = new CreatePaymentRequest(
                orderId,
                "UPI",
                "RAZORPAY",
                "INR"
        );

        MvcResult paymentResult = mockMvc.perform(post("/api/v1/payments/create")
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(paymentReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").isNotEmpty())
                .andExpect(jsonPath("$.data.transactionId").isNotEmpty())
                .andReturn();

        String paymentId = objectMapper.readTree(paymentResult.getResponse().getContentAsString())
                .path("data").path("id").asText();
        String transactionId = objectMapper.readTree(paymentResult.getResponse().getContentAsString())
                .path("data").path("transactionId").asText();

        // Simulate successful payment webhook
        PaymentWebhookRequest webhookReq = new PaymentWebhookRequest(
                "payment.captured",
                transactionId,
                orderId,
                "SUCCESS",
                new BigDecimal("90720.00"),
                "INR",
                "valid_sig_hash"
        );

        mockMvc.perform(post("/api/v1/payments/webhook")
                        .header("X-Razorpay-Signature", "valid_sig_hash")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(webhookReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.success").value(true))
                .andExpect(jsonPath("$.data.orderStatus").value("CONFIRMED"));

        // Verify Order status in database
        mockMvc.perform(get("/api/v1/orders/" + orderId)
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("CONFIRMED"));

        // Verify Inventory stock was decremented from 15 to 13
        Inventory updatedInventory = inventoryRepository.findByVariantId(seededVariant.getId()).orElseThrow();
        assertEquals(13, updatedInventory.getQuantity(), "Stock quantity should be decremented by ordered amount");
    }

    @Test
    @DisplayName("Failure State: Unauthenticated access without JWT is rejected with 401")
    void testUnauthenticatedAccessFails() throws Exception {
        mockMvc.perform(get("/api/v1/cart"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Failure State: Invalid login credentials returns 401 Unauthorized")
    void testInvalidLoginCredentialsFails() throws Exception {
        LoginRequest badLogin = new LoginRequest("nonexistent@funarray.store", "WrongPassword123");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badLogin)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Failure State: Ordering more items than available stock is rejected with 400 Bad Request")
    void testInsufficientStockFails() throws Exception {
        // Register customer
        String customerEmail = "outstock." + UUID.randomUUID() + "@funarray.store";
        RegisterRequest registerReq = new RegisterRequest(customerEmail, "Password@123", "Pooja", "Shah", "+919123456789");
        MvcResult res = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andReturn();

        String jwt = objectMapper.readTree(res.getResponse().getContentAsString()).path("data").path("accessToken").asText();

        // Attempt to add 99 items when stock is only 15
        AddToCartRequest excessiveReq = new AddToCartRequest(
                seededProduct.getId(),
                seededVariant.getId(),
                99
        );

        mockMvc.perform(post("/api/v1/cart/items")
                        .header("Authorization", "Bearer " + jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(excessiveReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false));
    }
}
