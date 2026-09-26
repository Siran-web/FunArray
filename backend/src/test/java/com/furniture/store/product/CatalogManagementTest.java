package com.furniture.store.product;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.furniture.store.auth.security.JwtTokenProvider;
import com.furniture.store.category.Category;
import com.furniture.store.category.CategoryRepository;
import com.furniture.store.category.dto.CreateCategoryRequest;
import com.furniture.store.category.dto.UpdateCategoryRequest;
import com.furniture.store.product.dto.*;
import com.furniture.store.product.entity.Product;
import com.furniture.store.product.repository.FurnitureModelRepository;
import com.furniture.store.product.repository.ProductImageRepository;
import com.furniture.store.product.repository.ProductRepository;
import com.furniture.store.product.repository.ProductVariantRepository;
import com.furniture.store.storage.dto.PresignedUploadRequest;
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
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CatalogManagementTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductVariantRepository productVariantRepository;

    @Autowired
    private ProductImageRepository productImageRepository;

    @Autowired
    private FurnitureModelRepository furnitureModelRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String adminToken;
    private String customerToken;
    private Category parentCategory;
    private Category childCategory;

    @BeforeEach
    void setUp() {
        furnitureModelRepository.deleteAll();
        productImageRepository.deleteAll();
        productVariantRepository.deleteAll();
        productRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();

        // Seed users
        User admin = new User("admin@catalog.com", passwordEncoder.encode("AdminPass123!"), "Admin", "User", null, Role.ADMIN, UserStatus.ACTIVE);
        userRepository.save(admin);
        adminToken = tokenProvider.generateAccessToken(admin.getId(), admin.getEmail(), admin.getRole());

        User customer = new User("customer@catalog.com", passwordEncoder.encode("CustPass123!"), "Customer", "User", null, Role.CUSTOMER, UserStatus.ACTIVE);
        userRepository.save(customer);
        customerToken = tokenProvider.generateAccessToken(customer.getId(), customer.getEmail(), customer.getRole());

        // Seed parent & child categories
        parentCategory = new Category(UUID.randomUUID().toString(), "Living Room", "living-room", "Living room collections", "https://assets.store.com/living.jpg", 1);
        categoryRepository.save(parentCategory);

        childCategory = new Category(UUID.randomUUID().toString(), "Sofas & Couches", "sofas-couches", "Comfortable sofas", "https://assets.store.com/sofa.jpg", parentCategory.getId(), 1);
        categoryRepository.save(childCategory);
    }

    // ==================== TICKET-008: Category Management ====================

    @Test
    @DisplayName("TICKET-008: Public user can retrieve categories and hierarchical tree")
    void testGetCategories() throws Exception {
        mockMvc.perform(get("/api/v1/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(2)));

        mockMvc.perform(get("/api/v1/categories/tree"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].slug", is("living-room")))
                .andExpect(jsonPath("$.data[0].children", hasSize(1)))
                .andExpect(jsonPath("$.data[0].children[0].slug", is("sofas-couches")));
    }

    @Test
    @DisplayName("TICKET-008: ADMIN can create a category with parent_id; CUSTOMER gets 403")
    void testCreateCategoryWithParent() throws Exception {
        CreateCategoryRequest req = new CreateCategoryRequest(
                "Sectional Sofas",
                "sectional-sofas",
                "L-shaped and modular sectional seating",
                "https://assets.store.com/sectional.jpg",
                childCategory.getId(),
                2
        );

        // Customer fails with 403
        mockMvc.perform(post("/api/v1/categories")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());

        // Admin succeeds with 201
        mockMvc.perform(post("/api/v1/categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("Sectional Sofas")))
                .andExpect(jsonPath("$.data.parentId", is(childCategory.getId())));
    }

    @Test
    @DisplayName("TICKET-008: Reject duplicate slug and invalid parent ID")
    void testCategoryValidation() throws Exception {
        CreateCategoryRequest duplicateSlug = new CreateCategoryRequest(
                "Living Room Duplicate",
                "living-room",
                "desc",
                null,
                null,
                1
        );

        mockMvc.perform(post("/api/v1/categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateSlug)))
                .andExpect(status().isConflict());

        CreateCategoryRequest invalidParent = new CreateCategoryRequest(
                "Dining Chairs",
                "dining-chairs",
                "desc",
                null,
                "non-existent-parent-uuid",
                1
        );

        mockMvc.perform(post("/api/v1/categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidParent)))
                .andExpect(status().isBadRequest());
    }

    // ==================== TICKET-009: Product Management API ====================

    @Test
    @DisplayName("TICKET-009: ADMIN can create, update, and delete product; slug and SKU must be unique")
    void testProductCrud() throws Exception {
        CreateProductRequest req = new CreateProductRequest(
                childCategory.getId(),
                "Malabar Solid Teak 3-Seater Sofa",
                "malabar-solid-teak-sofa",
                "Handcrafted 3-seater teak sofa with premium Belgian linen upholstery.",
                "FunArray Heritage",
                new BigDecimal("68500.00"),
                "ACTIVE",
                "Grade-A Plantation Teakwood",
                new BigDecimal("52.5"),
                new BigDecimal("210.0"),
                new BigDecimal("85.0"),
                new BigDecimal("92.0"),
                "SKU-SOFA-MLBR-01"
        );

        // Non-admin gets 403
        mockMvc.perform(post("/api/v1/products")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());

        // Admin creates product
        String responseContent = mockMvc.perform(post("/api/v1/products")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("Malabar Solid Teak 3-Seater Sofa")))
                .andExpect(jsonPath("$.data.dimensions.widthCm", is(210.0)))
                .andExpect(jsonPath("$.data.available", is(true)))
                .andReturn().getResponse().getContentAsString();

        String createdId = objectMapper.readTree(responseContent).path("data").path("id").asText();

        // Retrieve by ID
        mockMvc.perform(get("/api/v1/products/" + createdId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.slug", is("malabar-solid-teak-sofa")));

        // Update product
        UpdateProductRequest updateReq = new UpdateProductRequest(
                null,
                "Malabar Solid Teak 3-Seater Sofa (Updated)",
                null,
                null,
                null,
                new BigDecimal("71000.00"),
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );

        mockMvc.perform(put("/api/v1/products/" + createdId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.basePrice", is(71000.00)))
                .andExpect(jsonPath("$.data.name", is("Malabar Solid Teak 3-Seater Sofa (Updated)")));

        // Delete product
        mockMvc.perform(delete("/api/v1/products/" + createdId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/products/" + createdId))
                .andExpect(status().isNotFound());
    }

    // ==================== TICKET-010: Product Variants ====================

    @Test
    @DisplayName("TICKET-010: Product variant CRUD and unique variant SKU validation")
    void testProductVariants() throws Exception {
        Product product = createSampleProduct();

        CreateProductVariantRequest v1 = new CreateProductVariantRequest(
                "SKU-VAR-OATMEAL",
                "Oatmeal Linen",
                "Belgian Linen",
                new BigDecimal("68500.00"),
                12,
                "ACTIVE"
        );

        CreateProductVariantRequest v2 = new CreateProductVariantRequest(
                "SKU-VAR-CHARCOAL",
                "Charcoal Velvet",
                "Italian Velvet",
                new BigDecimal("72500.00"),
                5,
                "ACTIVE"
        );

        // Add variant 1
        String v1Res = mockMvc.perform(post("/api/v1/products/" + product.getId() + "/variants")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(v1)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.sku", is("SKU-VAR-OATMEAL")))
                .andReturn().getResponse().getContentAsString();

        String variant1Id = objectMapper.readTree(v1Res).path("data").path("id").asText();

        // Add variant 2
        mockMvc.perform(post("/api/v1/products/" + product.getId() + "/variants")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(v2)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.price", is(72500.00)));

        // Duplicate SKU rejection
        mockMvc.perform(post("/api/v1/products/" + product.getId() + "/variants")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(v1)))
                .andExpect(status().isConflict());

        // Get variants
        mockMvc.perform(get("/api/v1/products/" + product.getId() + "/variants"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(2)));

        // Update variant
        UpdateProductVariantRequest updateV1 = new UpdateProductVariantRequest(
                null,
                "Warm Oatmeal Linen",
                null,
                new BigDecimal("69000.00"),
                15,
                "ACTIVE"
        );

        mockMvc.perform(put("/api/v1/products/" + product.getId() + "/variants/" + variant1Id)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateV1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.color", is("Warm Oatmeal Linen")))
                .andExpect(jsonPath("$.data.stockQuantity", is(15)));

        // Delete variant
        mockMvc.perform(delete("/api/v1/products/" + product.getId() + "/variants/" + variant1Id)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/products/" + product.getId() + "/variants"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)));
    }

    // ==================== TICKET-011: Product Images ====================

    @Test
    @DisplayName("TICKET-011: Add, reorder, and primary toggle product images with file format check")
    void testProductImages() throws Exception {
        Product product = createSampleProduct();

        AddProductImageRequest img1 = new AddProductImageRequest(
                "https://cdn.store.com/images/sofa-front.webp",
                "Front perspective of sofa",
                0,
                true
        );

        AddProductImageRequest img2 = new AddProductImageRequest(
                "https://cdn.store.com/images/sofa-angle.jpg",
                "Angled corner of sofa",
                1,
                false
        );

        // Invalid file format rejected
        AddProductImageRequest invalidImg = new AddProductImageRequest(
                "https://cdn.store.com/images/malicious.exe",
                "Bad file",
                2,
                false
        );
        mockMvc.perform(post("/api/v1/products/" + product.getId() + "/images")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidImg)))
                .andExpect(status().isBadRequest());

        // Add valid images
        mockMvc.perform(post("/api/v1/products/" + product.getId() + "/images")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(img1)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.isPrimary", is(true)));

        String img2Res = mockMvc.perform(post("/api/v1/products/" + product.getId() + "/images")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(img2)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.isPrimary", is(false)))
                .andReturn().getResponse().getContentAsString();

        String img2Id = objectMapper.readTree(img2Res).path("data").path("id").asText();

        // Switch primary to img2
        mockMvc.perform(put("/api/v1/products/" + product.getId() + "/images/" + img2Id + "/primary")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isPrimary", is(true)));
    }

    // ==================== TICKET-012: 3D AR Model Management ====================

    @Test
    @DisplayName("TICKET-012: Associate and retrieve .glb 3D model with dimensions")
    void test3DModelManagement() throws Exception {
        Product product = createSampleProduct();

        SaveFurnitureModelRequest modelReq = new SaveFurnitureModelRequest(
                "https://funarray-furniture-storage.s3.ap-south-1.amazonaws.com/products/models/sofa.glb",
                "https://funarray-furniture-storage.s3.ap-south-1.amazonaws.com/products/thumbnails/sofa.webp",
                "glb",
                14500000L,
                new BigDecimal("210.0"),
                new BigDecimal("85.0"),
                new BigDecimal("92.0"),
                1,
                "ACTIVE"
        );

        // Associate model
        mockMvc.perform(post("/api/v1/products/" + product.getId() + "/model")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(modelReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.format", is("glb")))
                .andExpect(jsonPath("$.data.widthCm", is(210.0)))
                .andExpect(jsonPath("$.data.version", is(1)));

        // Retrieve model
        mockMvc.perform(get("/api/v1/products/" + product.getId() + "/model"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.modelUrl", containsString("sofa.glb")));

        // Customer AR asset endpoint
        mockMvc.perform(get("/api/v1/products/" + product.getId() + "/ar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.supported", is(true)))
                .andExpect(jsonPath("$.data.modelUrl", containsString("sofa.glb")));
    }

    // ==================== TICKET-013: Presigned S3 Upload URLs ====================

    @Test
    @DisplayName("TICKET-013: Direct S3 Presigned URL generation, file type & size validation")
    void testPresignedUploadUrls() throws Exception {
        // Valid image request
        PresignedUploadRequest validImgReq = new PresignedUploadRequest(
                "nordic-armchair.webp",
                "image/webp",
                2048500L,
                "PRODUCT_IMAGE"
        );

        mockMvc.perform(post("/api/v1/storage/presigned-upload-url")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validImgReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.uploadUrl", containsString("X-Amz-Signature")))
                .andExpect(jsonPath("$.data.fileUrl", containsString("products/images/")))
                .andExpect(jsonPath("$.data.key", containsString("nordic-armchair.webp")));

        // Valid 3D model request
        PresignedUploadRequest validModelReq = new PresignedUploadRequest(
                "dining-table.glb",
                "model/gltf-binary",
                25000000L,
                "3D_MODEL"
        );

        mockMvc.perform(post("/api/v1/storage/presigned-upload-url")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validModelReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fileUrl", containsString("products/models/")));

        // Exceeds max image size (10MB limit) -> 400 Bad Request
        PresignedUploadRequest oversizedImgReq = new PresignedUploadRequest(
                "huge-photo.jpg",
                "image/jpeg",
                15L * 1024 * 1024,
                "PRODUCT_IMAGE"
        );

        mockMvc.perform(post("/api/v1/storage/presigned-upload-url")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(oversizedImgReq)))
                .andExpect(status().isBadRequest());

        // Unauthorized customer trying to generate catalog product upload URL -> 403 Forbidden
        mockMvc.perform(post("/api/v1/storage/presigned-upload-url")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validImgReq)))
                .andExpect(status().isForbidden());
    }

    // ==================== TICKET-014: Product Listing & Search ====================

    @Test
    @DisplayName("TICKET-014: Filter products by category hierarchy, search term, and price")
    void testProductListingAndSearch() throws Exception {
        Product sofa = createSampleProduct();

        Product chair = new Product();
        chair.setId(UUID.randomUUID().toString());
        chair.setCategoryId(parentCategory.getId());
        chair.setName("Oslo Minimalist Armchair");
        chair.setSlug("oslo-minimalist-armchair");
        chair.setDescription("Scandinavian oak armchair");
        chair.setBrand("Nordic Studio");
        chair.setBasePrice(new BigDecimal("32000.00"));
        chair.setStatus("ACTIVE");
        chair.setWidthCm(new BigDecimal("80.0"));
        chair.setHeightCm(new BigDecimal("85.0"));
        chair.setDepthCm(new BigDecimal("75.0"));
        chair.setSku("SKU-CHAIR-OSLO");
        productRepository.save(chair);

        // Filter by parent category -> should return both parent and child category items
        mockMvc.perform(get("/api/v1/products?category=" + parentCategory.getSlug()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(2)));

        // Filter by child category -> should return only sofa
        mockMvc.perform(get("/api/v1/products?category=" + childCategory.getSlug()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].name", is("Malabar Solid Teak Sofa")));

        // Search by query "Oslo"
        mockMvc.perform(get("/api/v1/products?q=Oslo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].name", is("Oslo Minimalist Armchair")));

        // Price range filtering (30000 to 50000)
        mockMvc.perform(get("/api/v1/products?minPrice=30000&maxPrice=50000"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].name", is("Oslo Minimalist Armchair")));
    }

    private Product createSampleProduct() {
        Product p = new Product();
        p.setId(UUID.randomUUID().toString());
        p.setCategoryId(childCategory.getId());
        p.setName("Malabar Solid Teak Sofa");
        p.setSlug("malabar-solid-teak-sofa-" + UUID.randomUUID().toString().substring(0, 8));
        p.setDescription("Handcrafted teak sofa");
        p.setBrand("FunArray Studio");
        p.setBasePrice(new BigDecimal("68500.00"));
        p.setStatus("ACTIVE");
        p.setWidthCm(new BigDecimal("210.0"));
        p.setHeightCm(new BigDecimal("85.0"));
        p.setDepthCm(new BigDecimal("92.0"));
        p.setSku("SKU-" + UUID.randomUUID().toString().substring(0, 8));
        return productRepository.save(p);
    }
}
