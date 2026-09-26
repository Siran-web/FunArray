package com.furniture.store.cart;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.furniture.store.auth.security.JwtTokenProvider;
import com.furniture.store.auth.security.UserPrincipal;
import com.furniture.store.cart.dto.AddToCartRequest;
import com.furniture.store.cart.dto.UpdateCartItemRequest;
import com.furniture.store.cart.entity.Cart;
import com.furniture.store.cart.entity.CartItem;
import com.furniture.store.cart.repository.CartItemRepository;
import com.furniture.store.cart.repository.CartRepository;
import com.furniture.store.category.Category;
import com.furniture.store.category.CategoryRepository;
import com.furniture.store.inventory.entity.Inventory;
import com.furniture.store.inventory.repository.InventoryRepository;
import com.furniture.store.order.dto.CheckoutRequest;
import com.furniture.store.order.entity.Order;
import com.furniture.store.order.entity.OrderItem;
import com.furniture.store.order.repository.OrderItemRepository;
import com.furniture.store.order.repository.OrderRepository;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

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
class CartAndCheckoutTest {

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
    private JwtTokenProvider tokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User testUser;
    private String userToken;
    private Address testAddress;
    private Category testCategory;
    private Product testProduct;
    private ProductVariant testVariant;
    private Inventory testInventory;

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        cleanDatabase();
    }

    private void cleanDatabase() {
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

        // 1. Create User & Token
        testUser = new User();
        testUser.setId(UUID.randomUUID().toString());
        testUser.setEmail("shopper@funarray.test");
        testUser.setPasswordHash(passwordEncoder.encode("SecretPass123!"));
        testUser.setFirstName("Jane");
        testUser.setLastName("Shopper");
        testUser.setRole(Role.CUSTOMER);
        testUser.setStatus(UserStatus.ACTIVE);
        testUser = userRepository.save(testUser);

        userToken = tokenProvider.generateAccessToken(testUser.getId(), testUser.getEmail(), testUser.getRole());

        // 2. Create Address
        testAddress = new Address();
        testAddress.setId(UUID.randomUUID().toString());
        testAddress.setUser(testUser);
        testAddress.setAddressLine1("742 Evergreen Terrace");
        testAddress.setCity("Springfield");
        testAddress.setState("OR");
        testAddress.setPostalCode("97477");
        testAddress.setCountry("USA");
        testAddress.setIsDefault(true);
        testAddress = addressRepository.save(testAddress);

        // 3. Create Category & Product
        testCategory = new Category();
        testCategory.setId(UUID.randomUUID().toString());
        testCategory.setName("Living Room");
        testCategory.setSlug("living-room");
        testCategory = categoryRepository.save(testCategory);

        testProduct = new Product();
        testProduct.setId(UUID.randomUUID().toString());
        testProduct.setCategoryId(testCategory.getId());
        testProduct.setName("Nordic Minimalist Sofa");
        testProduct.setSlug("nordic-minimalist-sofa");
        testProduct.setSku("PROD-NORDIC-SOFA");
        testProduct.setBasePrice(new BigDecimal("299.99"));
        testProduct.setWidthCm(new BigDecimal("200.0"));
        testProduct.setHeightCm(new BigDecimal("85.0"));
        testProduct.setDepthCm(new BigDecimal("90.0"));
        testProduct = productRepository.save(testProduct);

        testVariant = new ProductVariant();
        testVariant.setId(UUID.randomUUID().toString());
        testVariant.setProduct(testProduct);
        testVariant.setSku("SOFA-NORDIC-OATMEAL");
        testVariant.setColor("Oatmeal");
        testVariant.setMaterial("Linen");
        testVariant.setPrice(new BigDecimal("299.99"));
        testVariant.setStockQuantity(10);
        testVariant = productVariantRepository.save(testVariant);

        testInventory = new Inventory(
                UUID.randomUUID().toString(),
                testProduct,
                testVariant,
                10
        );
        testInventory = inventoryRepository.save(testInventory);
    }

    // ==================== TICKET-024: Shopping Cart Tests ====================

    @Test
    @DisplayName("TICKET-024: GET /api/v1/cart creates or returns persistent user cart")
    void shouldReturnEmptyCartForNewUser() throws Exception {
        mockMvc.perform(get("/api/v1/cart")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.userId").value(testUser.getId()))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andExpect(jsonPath("$.data.totalItems").value(0))
                .andExpect(jsonPath("$.data.subtotal").value(0));
    }

    @Test
    @DisplayName("TICKET-024: POST /api/v1/cart/items adds item with server-authoritative pricing and inventory check")
    void shouldAddItemToCartAuthoritatively() throws Exception {
        AddToCartRequest request = new AddToCartRequest(testProduct.getId(), testVariant.getId(), 2);

        mockMvc.perform(post("/api/v1/cart/items")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(2))
                .andExpect(jsonPath("$.data.subtotal").value(599.98))
                .andExpect(jsonPath("$.data.items[0].productName").value("Nordic Minimalist Sofa"))
                .andExpect(jsonPath("$.data.items[0].variantSku").value("SOFA-NORDIC-OATMEAL"))
                .andExpect(jsonPath("$.data.items[0].quantity").value(2))
                .andExpect(jsonPath("$.data.items[0].unitPrice").value(299.99))
                .andExpect(jsonPath("$.data.items[0].totalPrice").value(599.98));
    }

    @Test
    @DisplayName("TICKET-024: Rejects adding more items than available stock")
    void shouldRejectAddingBeyondAvailableStock() throws Exception {
        AddToCartRequest request = new AddToCartRequest(testProduct.getId(), testVariant.getId(), 15);

        mockMvc.perform(post("/api/v1/cart/items")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("TICKET-024: PUT /api/v1/cart/items/{id} updates item quantity")
    void shouldUpdateCartItemQuantity() throws Exception {
        // First add item
        AddToCartRequest addReq = new AddToCartRequest(testProduct.getId(), testVariant.getId(), 1);
        MvcResult addRes = mockMvc.perform(post("/api/v1/cart/items")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isOk())
                .andReturn();

        String cartItemId = objectMapper.readTree(addRes.getResponse().getContentAsString())
                .path("data").path("items").get(0).path("id").asText();

        // Update quantity to 3
        UpdateCartItemRequest updateReq = new UpdateCartItemRequest(3);
        mockMvc.perform(put("/api/v1/cart/items/" + cartItemId)
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(3))
                .andExpect(jsonPath("$.data.subtotal").value(899.97))
                .andExpect(jsonPath("$.data.items[0].quantity").value(3));
    }

    @Test
    @DisplayName("TICKET-024: DELETE /api/v1/cart/items/{id} removes item from cart")
    void shouldRemoveCartItem() throws Exception {
        AddToCartRequest addReq = new AddToCartRequest(testProduct.getId(), testVariant.getId(), 1);
        MvcResult addRes = mockMvc.perform(post("/api/v1/cart/items")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isOk())
                .andReturn();

        String cartItemId = objectMapper.readTree(addRes.getResponse().getContentAsString())
                .path("data").path("items").get(0).path("id").asText();

        mockMvc.perform(delete("/api/v1/cart/items/" + cartItemId)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(0))
                .andExpect(jsonPath("$.data.subtotal").value(0));
    }

    // ==================== TICKET-025: Checkout Tests ====================

    @Test
    @DisplayName("TICKET-025: GET /api/v1/checkout/preview calculates server-authoritative totals (subtotal, shipping, tax, discounts)")
    void shouldCalculateCheckoutPreviewCorrectly() throws Exception {
        // Add 1 item ($299.99 < $500 threshold, so standard shipping $29.99 applies)
        AddToCartRequest addReq = new AddToCartRequest(testProduct.getId(), testVariant.getId(), 1);
        mockMvc.perform(post("/api/v1/cart/items")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/checkout/preview")
                        .param("shippingAddressId", testAddress.getId())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.subtotal").value(299.99))
                .andExpect(jsonPath("$.data.shippingFee").value(29.99))
                .andExpect(jsonPath("$.data.tax").value(24.00)) // 299.99 * 0.08 = 23.9992 -> 24.00
                .andExpect(jsonPath("$.data.discount").value(0.00))
                .andExpect(jsonPath("$.data.totalAmount").value(353.98)) // 299.99 + 29.99 + 24.00 = 353.98
                .andExpect(jsonPath("$.data.eligibleForFreeShipping").value(false))
                .andExpect(jsonPath("$.data.shippingAddress.addressLine1").value("742 Evergreen Terrace"));
    }

    @Test
    @DisplayName("TICKET-025: Preview applies free shipping when subtotal >= $500 and coupon discounts")
    void shouldApplyFreeShippingAndCouponCodeInPreview() throws Exception {
        // Add 2 items ($599.98 >= $500 threshold -> Free Shipping) + WELCOME10 (10% off $599.98 = $60.00)
        AddToCartRequest addReq = new AddToCartRequest(testProduct.getId(), testVariant.getId(), 2);
        mockMvc.perform(post("/api/v1/cart/items")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/checkout/preview")
                        .param("shippingAddressId", testAddress.getId())
                        .param("couponCode", "WELCOME10")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.subtotal").value(599.98))
                .andExpect(jsonPath("$.data.shippingFee").value(0.00))
                .andExpect(jsonPath("$.data.tax").value(48.00)) // 599.98 * 0.08 = 47.9984 -> 48.00
                .andExpect(jsonPath("$.data.discount").value(60.00)) // 10% of 599.98 = 59.998 -> 60.00
                .andExpect(jsonPath("$.data.totalAmount").value(587.98)) // 599.98 + 0.00 + 48.00 - 60.00 = 587.98
                .andExpect(jsonPath("$.data.eligibleForFreeShipping").value(true));
    }

    @Test
    @DisplayName("TICKET-025: POST /api/v1/checkout successfully places order, deducts inventory, and clears cart")
    void shouldCompleteCheckoutAndDeductInventory() throws Exception {
        // 1. Add 2 items to cart
        AddToCartRequest addReq = new AddToCartRequest(testProduct.getId(), testVariant.getId(), 2);
        mockMvc.perform(post("/api/v1/cart/items")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isOk());

        // 2. Perform checkout
        CheckoutRequest checkoutReq = new CheckoutRequest(
                testAddress.getId(),
                "CARD",
                "Leave at front door",
                "WELCOME10"
        );

        MvcResult checkoutRes = mockMvc.perform(post("/api/v1/checkout")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.orderNumber").exists())
                .andExpect(jsonPath("$.data.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.data.subtotal").value(599.98))
                .andExpect(jsonPath("$.data.discount").value(60.00))
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.items[0].quantity").value(2))
                .andReturn();

        String orderId = objectMapper.readTree(checkoutRes.getResponse().getContentAsString())
                .path("data").path("id").asText();

        // 3. Verify inventory quantity updated (10 - 2 = 8 available)
        Inventory updatedInv = inventoryRepository.findByVariantId(testVariant.getId()).orElseThrow();
        assertEquals(8, updatedInv.getQuantity());
        assertEquals(0, updatedInv.getReserved());
        assertEquals(8, updatedInv.getAvailable());

        // 4. Verify cart is empty
        mockMvc.perform(get("/api/v1/cart")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(0))
                .andExpect(jsonPath("$.data.subtotal").value(0));

        // 5. Verify order can be retrieved
        mockMvc.perform(get("/api/v1/orders/" + orderId)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(orderId))
                .andExpect(jsonPath("$.data.shippingAddress.addressLine1").value("742 Evergreen Terrace"));
    }

    @Test
    @DisplayName("TICKET-025: Checkout fails when cart is empty")
    void shouldRejectCheckoutWithEmptyCart() throws Exception {
        CheckoutRequest checkoutReq = new CheckoutRequest(
                testAddress.getId(),
                "CARD",
                null,
                null
        );

        mockMvc.perform(post("/api/v1/checkout")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutReq)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TICKET-025: Checkout fails when shipping address is invalid")
    void shouldRejectCheckoutWithInvalidAddress() throws Exception {
        AddToCartRequest addReq = new AddToCartRequest(testProduct.getId(), testVariant.getId(), 1);
        mockMvc.perform(post("/api/v1/cart/items")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isOk());

        CheckoutRequest checkoutReq = new CheckoutRequest(
                "invalid-address-id-12345",
                "CARD",
                null,
                null
        );

        mockMvc.perform(post("/api/v1/checkout")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutReq)))
                .andExpect(status().isBadRequest());
    }
}
