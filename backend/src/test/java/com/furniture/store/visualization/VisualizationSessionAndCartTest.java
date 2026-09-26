package com.furniture.store.visualization;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.furniture.store.auth.security.JwtTokenProvider;
import com.furniture.store.cart.dto.AddToCartRequest;
import com.furniture.store.cart.repository.CartItemRepository;
import com.furniture.store.cart.repository.CartRepository;
import com.furniture.store.category.Category;
import com.furniture.store.category.CategoryRepository;
import com.furniture.store.inventory.entity.Inventory;
import com.furniture.store.inventory.repository.InventoryRepository;
import com.furniture.store.product.entity.Product;
import com.furniture.store.product.entity.ProductVariant;
import com.furniture.store.product.repository.ProductRepository;
import com.furniture.store.product.repository.ProductVariantRepository;
import com.furniture.store.user.entity.Role;
import com.furniture.store.user.entity.User;
import com.furniture.store.user.entity.UserStatus;
import com.furniture.store.user.repository.UserRepository;
import com.furniture.store.visualization.document.VisualizationSession;
import com.furniture.store.visualization.dto.SaveSessionRequest;
import com.furniture.store.visualization.repository.RoomImageRepository;
import com.furniture.store.visualization.repository.VisualizationSessionRepository;
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
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class VisualizationSessionAndCartTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private VisualizationSessionRepository sessionRepository;

    @Autowired
    private RoomImageRepository roomImageRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private ProductVariantRepository productVariantRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User userA;
    private User userB;
    private String tokenA;
    private String tokenB;
    private Product product;
    private ProductVariant variant;

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        cartItemRepository.deleteAll();
        cartRepository.deleteAll();
        sessionRepository.deleteAll();
        roomImageRepository.deleteAll();
        inventoryRepository.deleteAll();
        productVariantRepository.deleteAll();
        productRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();
    }

    @BeforeEach
    void setUp() {
        cartItemRepository.deleteAll();
        cartRepository.deleteAll();
        sessionRepository.deleteAll();
        roomImageRepository.deleteAll();
        inventoryRepository.deleteAll();
        productVariantRepository.deleteAll();
        productRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();

        userA = new User(UUID.randomUUID().toString(), "user_viz_a@furniture.com", passwordEncoder.encode("Pass123!"), "Alice", "Viz", Role.CUSTOMER, UserStatus.ACTIVE);
        userRepository.save(userA);
        tokenA = "Bearer " + jwtTokenProvider.generateAccessToken(userA.getId(), userA.getEmail(), userA.getRole());

        userB = new User(UUID.randomUUID().toString(), "user_viz_b@furniture.com", passwordEncoder.encode("Pass123!"), "Bob", "Viz", Role.CUSTOMER, UserStatus.ACTIVE);
        userRepository.save(userB);
        tokenB = "Bearer " + jwtTokenProvider.generateAccessToken(userB.getId(), userB.getEmail(), userB.getRole());

        Category cat = new Category(UUID.randomUUID().toString(), "Living Room", "living-room", "Desc", null, 1);
        categoryRepository.save(cat);

        product = new Product();
        product.setId(UUID.randomUUID().toString());
        product.setCategoryId(cat.getId());
        product.setName("Scandinavian Lounge Chair");
        product.setSlug("scandinavian-lounge-chair");
        product.setBasePrice(new BigDecimal("349.99"));
        product.setStatus("ACTIVE");
        product.setWidthCm(new BigDecimal("85"));
        product.setHeightCm(new BigDecimal("90"));
        product.setDepthCm(new BigDecimal("80"));
        product.setSku("LC-001");
        productRepository.save(product);

        variant = new ProductVariant(
                UUID.randomUUID().toString(),
                product,
                "LC-001-OAK",
                "Natural Oak",
                "Linen",
                new BigDecimal("349.99"),
                5, // 5 items in stock
                "ACTIVE"
        );
        productVariantRepository.save(variant);

        Inventory inv = new Inventory(UUID.randomUUID().toString(), product, variant, 5);
        inventoryRepository.save(inv);
    }

    // ==========================================
    // TICKET-022: Visualization Session API Tests
    // ==========================================

    @Test
    @DisplayName("TICKET-022: Create, retrieve, update, and delete visualization session under /api/v1/visualizations")
    void testVisualizationSessionLifecycle() throws Exception {
        SaveSessionRequest createReq = new SaveSessionRequest(
                "My Loft Layout",
                null,
                "https://storage.com/rooms/loft.jpg",
                "[{\"id\":\"item-1\",\"productId\":\"" + product.getId() + "\",\"position\":[0,0,0],\"rotation\":[0,45,0],\"scale\":[1,1,1]}]"
        );

        // 1. Create session (POST /api/v1/visualizations)
        String resJson = mockMvc.perform(post("/api/v1/visualizations")
                        .header("Authorization", tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("My Loft Layout"))
                .andExpect(jsonPath("$.data.roomImageUrl").value("https://storage.com/rooms/loft.jpg"))
                .andReturn().getResponse().getContentAsString();

        String sessionId = objectMapper.readTree(resJson).get("data").get("id").asText();

        // 2. Retrieve session (GET /api/v1/visualizations/{id})
        mockMvc.perform(get("/api/v1/visualizations/" + sessionId)
                        .header("Authorization", tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("My Loft Layout"));

        // 3. Update session (PUT /api/v1/visualizations/{id})
        SaveSessionRequest updateReq = new SaveSessionRequest(
                "Updated Loft Layout",
                null,
                "https://storage.com/rooms/loft-updated.jpg",
                "[{\"id\":\"item-1\",\"productId\":\"" + product.getId() + "\",\"position\":[1,0,1],\"rotation\":[0,90,0],\"scale\":[1,1,1]}]"
        );

        mockMvc.perform(put("/api/v1/visualizations/" + sessionId)
                        .header("Authorization", tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Updated Loft Layout"))
                .andExpect(jsonPath("$.data.roomImageUrl").value("https://storage.com/rooms/loft-updated.jpg"));

        // 4. User B cannot modify User A's session -> 403 Forbidden
        mockMvc.perform(put("/api/v1/visualizations/" + sessionId)
                        .header("Authorization", tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isForbidden());

        // 5. User B cannot delete User A's session -> 403 Forbidden
        mockMvc.perform(delete("/api/v1/visualizations/" + sessionId)
                        .header("Authorization", tokenB))
                .andExpect(status().isForbidden());

        // 6. User A deletes session
        mockMvc.perform(delete("/api/v1/visualizations/" + sessionId)
                        .header("Authorization", tokenA))
                .andExpect(status().isOk());

        // 7. Deleted session cannot be retrieved -> 404 Not Found
        mockMvc.perform(get("/api/v1/visualizations/" + sessionId)
                        .header("Authorization", tokenA))
                .andExpect(status().isNotFound());
    }

    // ==========================================
    // TICKET-023: Add-to-Cart from Visualization
    // ==========================================

    @Test
    @DisplayName("TICKET-023: User can add visualized furniture directly to cart with authoritative pricing")
    void testAddToCartAuthoritativePriceAndStock() throws Exception {
        AddToCartRequest addReq = new AddToCartRequest(
                product.getId(),
                variant.getId(),
                2 // requested 2 out of 5 available
        );

        mockMvc.perform(post("/api/v1/cart/items")
                        .header("Authorization", tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(2))
                .andExpect(jsonPath("$.data.subtotal").value(699.98)) // 2 * 349.99
                .andExpect(jsonPath("$.data.items", hasSize(1)))
                .andExpect(jsonPath("$.data.items[0].productName").value("Scandinavian Lounge Chair"))
                .andExpect(jsonPath("$.data.items[0].unitPrice").value(349.99));

        // Verify cart endpoint retrieval
        mockMvc.perform(get("/api/v1/cart")
                        .header("Authorization", tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalItems").value(2));
    }

    @Test
    @DisplayName("TICKET-023: Adding to cart fails with 409 Conflict if stock is insufficient")
    void testAddToCartFailsWhenStockInsufficient() throws Exception {
        AddToCartRequest addExcessiveReq = new AddToCartRequest(
                product.getId(),
                variant.getId(),
                10 // only 5 available in stock
        );

        mockMvc.perform(post("/api/v1/cart/items")
                        .header("Authorization", tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addExcessiveReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("INSUFFICIENT_INVENTORY"))
                .andExpect(jsonPath("$.error.message", containsString("LC-001-OAK")));
    }
}
