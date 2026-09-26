package com.furniture.store.inventory;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.furniture.store.auth.security.JwtTokenProvider;
import com.furniture.store.category.Category;
import com.furniture.store.category.CategoryRepository;
import com.furniture.store.exception.InsufficientInventoryException;
import com.furniture.store.inventory.dto.*;
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
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class InventoryManagementTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductVariantRepository productVariantRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private InventoryService inventoryService;

    private String adminToken;
    private String customerToken;
    private Product testProduct;
    private ProductVariant testVariant1;
    private ProductVariant testVariant2;

    @BeforeEach
    void setUp() {
        inventoryRepository.deleteAll();
        productVariantRepository.deleteAll();
        productRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Setup Admin user
        User admin = new User(
                UUID.randomUUID().toString(),
                "admin_inv@furniture.com",
                passwordEncoder.encode("Password123!"),
                "Admin",
                "Inv",
                Role.ADMIN,
                UserStatus.ACTIVE
        );
        userRepository.save(admin);
        adminToken = "Bearer " + jwtTokenProvider.generateAccessToken(admin.getId(), admin.getEmail(), admin.getRole());

        // 2. Setup Customer user
        User customer = new User(
                UUID.randomUUID().toString(),
                "customer_inv@furniture.com",
                passwordEncoder.encode("Password123!"),
                "Customer",
                "Inv",
                Role.CUSTOMER,
                UserStatus.ACTIVE
        );
        userRepository.save(customer);
        customerToken = "Bearer " + jwtTokenProvider.generateAccessToken(customer.getId(), customer.getEmail(), customer.getRole());

        // 3. Setup Category, Product & Variants
        Category cat = new Category(UUID.randomUUID().toString(), "Chairs", "chairs", "Description", null, null);
        categoryRepository.save(cat);

        testProduct = new Product();
        testProduct.setId(UUID.randomUUID().toString());
        testProduct.setCategoryId(cat.getId());
        testProduct.setName("Nordic Armchair");
        testProduct.setSlug("nordic-armchair");
        testProduct.setDescription("Minimalist comfortable armchair");
        testProduct.setBrand("NordicLiving");
        testProduct.setBasePrice(new BigDecimal("299.99"));
        testProduct.setStatus("ACTIVE");
        testProduct.setMaterial("Oak & Fabric");
        testProduct.setWidthCm(new BigDecimal("80"));
        testProduct.setHeightCm(new BigDecimal("85"));
        testProduct.setDepthCm(new BigDecimal("80"));
        testProduct.setWeight(new BigDecimal("12.5"));
        testProduct.setSku("ARM-001");
        productRepository.save(testProduct);

        testVariant1 = new ProductVariant(
                UUID.randomUUID().toString(),
                testProduct,
                "ARM-001-GRY",
                "Grey",
                "Fabric",
                new BigDecimal("299.99"),
                20,
                "ACTIVE"
        );
        productVariantRepository.save(testVariant1);

        testVariant2 = new ProductVariant(
                UUID.randomUUID().toString(),
                testProduct,
                "ARM-001-BLU",
                "Blue",
                "Velvet",
                new BigDecimal("329.99"),
                3, // Low stock variant
                "ACTIVE"
        );
        productVariantRepository.save(testVariant2);

        // Pre-create inventory items
        Inventory inv1 = new Inventory(UUID.randomUUID().toString(), testProduct, testVariant1, 20);
        inventoryRepository.save(inv1);

        Inventory inv2 = new Inventory(UUID.randomUUID().toString(), testProduct, testVariant2, 3);
        inventoryRepository.save(inv2);
    }

    // ==========================================
    // TICKET-016: Inventory Management Tests
    // ==========================================

    @Test
    @DisplayName("TICKET-016: Available quantity correctly equals quantity minus reserved")
    void testAvailableQuantityCalculation() {
        Inventory inv = inventoryRepository.findByVariantId(testVariant1.getId()).orElseThrow();
        assertEquals(20, inv.getQuantity());
        assertEquals(0, inv.getReserved());
        assertEquals(20, inv.getAvailable());

        inv.reserve(5);
        assertEquals(20, inv.getQuantity());
        assertEquals(5, inv.getReserved());
        assertEquals(15, inv.getAvailable());

        inv.releaseReservation(2);
        assertEquals(20, inv.getQuantity());
        assertEquals(3, inv.getReserved());
        assertEquals(17, inv.getAvailable());

        inv.commitReservation(3);
        assertEquals(17, inv.getQuantity());
        assertEquals(0, inv.getReserved());
        assertEquals(17, inv.getAvailable());
    }

    @Test
    @DisplayName("TICKET-016: Admin can fetch paginated inventory and filter low stock")
    void testAdminGetInventoryAndLowStock() throws Exception {
        // Fetch all inventory items
        mockMvc.perform(get("/api/v1/inventory")
                        .header("Authorization", adminToken)
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content", hasSize(2)));

        // Filter low stock with threshold = 5
        mockMvc.perform(get("/api/v1/inventory/low-stock")
                        .header("Authorization", adminToken)
                        .param("threshold", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].variantSku").value("ARM-001-BLU"))
                .andExpect(jsonPath("$[0].available").value(3));
    }

    @Test
    @DisplayName("TICKET-016: Admin can update absolute stock quantity")
    void testAdminUpdateStock() throws Exception {
        UpdateStockRequest req = new UpdateStockRequest(50);

        mockMvc.perform(put("/api/v1/inventory/variant/" + testVariant1.getId())
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(50))
                .andExpect(jsonPath("$.available").value(50));

        // Verify variant stock sync
        ProductVariant updatedVariant = productVariantRepository.findById(testVariant1.getId()).orElseThrow();
        assertEquals(50, updatedVariant.getStockQuantity());
    }

    @Test
    @DisplayName("TICKET-016: Admin can relatively adjust stock up or down")
    void testAdminAdjustStock() throws Exception {
        // Adjust stock by +10
        AdjustStockRequest reqAdd = new AdjustStockRequest(10, "Restock arrived");
        mockMvc.perform(post("/api/v1/inventory/variant/" + testVariant1.getId() + "/adjust")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqAdd)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(30))
                .andExpect(jsonPath("$.available").value(30));

        // Adjust stock by -5
        AdjustStockRequest reqSub = new AdjustStockRequest(-5, "Damaged items write-off");
        mockMvc.perform(post("/api/v1/inventory/variant/" + testVariant1.getId() + "/adjust")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqSub)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(25))
                .andExpect(jsonPath("$.available").value(25));
    }

    @Test
    @DisplayName("TICKET-016: Stock cannot become negative on reduction")
    void testStockCannotBecomeNegative() throws Exception {
        AdjustStockRequest reqExcessive = new AdjustStockRequest(-50, "Excessive reduction"); // only 20 in stock
        mockMvc.perform(post("/api/v1/inventory/variant/" + testVariant1.getId() + "/adjust")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqExcessive)))
                .andExpect(status().isBadRequest());
    }

    // ========================================================
    // TICKET-017: Inventory Availability Enforcement Tests
    // ========================================================

    @Test
    @DisplayName("TICKET-017: Customer can check single and bulk availability")
    void testCheckAvailability() throws Exception {
        // Check single variant
        mockMvc.perform(get("/api/v1/inventory/check/" + testVariant1.getId())
                        .param("quantity", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inStock").value(true))
                .andExpect(jsonPath("$.availableQuantity").value(20));

        // Check bulk items
        List<StockItemRequest> bulkReq = List.of(
                new StockItemRequest(testVariant1.getId(), 5),
                new StockItemRequest(testVariant2.getId(), 10) // Requested 10, only 3 available
        );

        mockMvc.perform(post("/api/v1/inventory/check")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(bulkReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].inStock").value(true))
                .andExpect(jsonPath("$[1].inStock").value(false))
                .andExpect(jsonPath("$[1].availableQuantity").value(3));
    }

    @Test
    @DisplayName("TICKET-017: Successful reservation deducts available and increases reserved")
    void testSuccessfulStockReservation() throws Exception {
        ReserveStockRequest req = new ReserveStockRequest(
                List.of(new StockItemRequest(testVariant1.getId(), 4))
        );

        mockMvc.perform(post("/api/v1/inventory/reserve")
                        .header("Authorization", customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.reservationId").isNotEmpty());

        Inventory updatedInv = inventoryRepository.findByVariantId(testVariant1.getId()).orElseThrow();
        assertEquals(20, updatedInv.getQuantity());
        assertEquals(4, updatedInv.getReserved());
        assertEquals(16, updatedInv.getAvailable());
    }

    @Test
    @DisplayName("TICKET-017: Failed reservation when stock is insufficient returns 409 Conflict with details")
    void testFailedStockReservationInsufficient() throws Exception {
        ReserveStockRequest req = new ReserveStockRequest(
                List.of(new StockItemRequest(testVariant2.getId(), 5)) // only 3 available
        );

        mockMvc.perform(post("/api/v1/inventory/reserve")
                        .header("Authorization", customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("INSUFFICIENT_INVENTORY"))
                .andExpect(jsonPath("$.error.message", containsString("ARM-001-BLU")))
                .andExpect(jsonPath("$.error.message", containsString("requested 5, but only 3 available")));

        // Ensure no stock was reserved (transaction rolled back)
        Inventory unchangedInv = inventoryRepository.findByVariantId(testVariant2.getId()).orElseThrow();
        assertEquals(0, unchangedInv.getReserved());
        assertEquals(3, unchangedInv.getAvailable());
    }

    @Test
    @DisplayName("TICKET-017: Releasing reservation restores available quantity")
    void testReleaseReservation() throws Exception {
        // First reserve 5
        inventoryService.reserveInventory(List.of(new StockItemRequest(testVariant1.getId(), 5)));
        Inventory invAfterReserve = inventoryRepository.findByVariantId(testVariant1.getId()).orElseThrow();
        assertEquals(15, invAfterReserve.getAvailable());
        assertEquals(5, invAfterReserve.getReserved());

        // Release reservation
        ReserveStockRequest releaseReq = new ReserveStockRequest(
                List.of(new StockItemRequest(testVariant1.getId(), 5))
        );

        mockMvc.perform(post("/api/v1/inventory/release")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(releaseReq)))
                .andExpect(status().isOk());

        Inventory invAfterRelease = inventoryRepository.findByVariantId(testVariant1.getId()).orElseThrow();
        assertEquals(20, invAfterRelease.getAvailable());
        assertEquals(0, invAfterRelease.getReserved());
    }

    @Test
    @DisplayName("TICKET-017: Committing reservation permanently updates total quantity and variant stock")
    void testCommitReservation() throws Exception {
        // First reserve 5
        inventoryService.reserveInventory(List.of(new StockItemRequest(testVariant1.getId(), 5)));

        // Commit reservation
        ReserveStockRequest commitReq = new ReserveStockRequest(
                List.of(new StockItemRequest(testVariant1.getId(), 5))
        );

        mockMvc.perform(post("/api/v1/inventory/commit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(commitReq)))
                .andExpect(status().isOk());

        Inventory committedInv = inventoryRepository.findByVariantId(testVariant1.getId()).orElseThrow();
        assertEquals(15, committedInv.getQuantity());
        assertEquals(0, committedInv.getReserved());
        assertEquals(15, committedInv.getAvailable());

        ProductVariant variant = productVariantRepository.findById(testVariant1.getId()).orElseThrow();
        assertEquals(15, variant.getStockQuantity());
    }

    @Test
    @DisplayName("TICKET-017: Concurrent reservations cannot oversell inventory")
    void testConcurrentReservationsCannotOversell() throws Exception {
        // testVariant2 has 3 units in stock.
        // We spawn 10 concurrent threads each attempting to reserve 1 unit.
        // Exactly 3 must succeed, and 7 must fail with InsufficientInventoryException.
        int totalThreads = 10;
        ExecutorService executor = Executors.newFixedThreadPool(totalThreads);
        CountDownLatch latch = new CountDownLatch(1);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);

        List<Future<?>> futures = new CopyOnWriteArrayList<>();

        for (int i = 0; i < totalThreads; i++) {
            futures.add(executor.submit(() -> {
                try {
                    latch.await();
                    inventoryService.reserveInventory(List.of(new StockItemRequest(testVariant2.getId(), 1)));
                    successCount.incrementAndGet();
                } catch (InsufficientInventoryException e) {
                    failCount.incrementAndGet();
                } catch (Exception e) {
                    // unexpected error
                }
            }));
        }

        // Start all threads at the same instant
        latch.countDown();

        for (Future<?> future : futures) {
            future.get(10, TimeUnit.SECONDS);
        }
        executor.shutdown();

        assertEquals(3, successCount.get(), "Exactly 3 reservations should succeed for 3 available items");
        assertEquals(7, failCount.get(), "Remaining 7 attempts must fail with InsufficientInventoryException");

        Inventory finalInv = inventoryRepository.findByVariantId(testVariant2.getId()).orElseThrow();
        assertEquals(3, finalInv.getQuantity());
        assertEquals(3, finalInv.getReserved());
        assertEquals(0, finalInv.getAvailable(), "Available quantity must be exactly 0, zero overselling");
    }
}
