package com.furniture.store.visualization;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.furniture.store.auth.security.JwtTokenProvider;
import com.furniture.store.category.Category;
import com.furniture.store.category.CategoryRepository;
import com.furniture.store.product.entity.Product;
import com.furniture.store.product.repository.ProductRepository;
import com.furniture.store.user.entity.Role;
import com.furniture.store.user.entity.User;
import com.furniture.store.user.entity.UserStatus;
import com.furniture.store.user.repository.UserRepository;
import com.furniture.store.visualization.dto.RenameDesignRequest;
import com.furniture.store.visualization.dto.SaveSessionRequest;
import com.furniture.store.visualization.repository.VisualizationSessionRepository;
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
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class SavedRoomDesignTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private VisualizationSessionRepository sessionRepository;

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

    @AfterEach
    void tearDown() {
        sessionRepository.deleteAll();
        productRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();
    }

    @BeforeEach
    void setUp() {
        sessionRepository.deleteAll();
        productRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();

        userA = new User(UUID.randomUUID().toString(), "alice_designs@furniture.com", passwordEncoder.encode("Pass123!"), "Alice", "Designer", Role.CUSTOMER, UserStatus.ACTIVE);
        userRepository.save(userA);
        tokenA = "Bearer " + jwtTokenProvider.generateAccessToken(userA.getId(), userA.getEmail(), userA.getRole());

        userB = new User(UUID.randomUUID().toString(), "bob_designs@furniture.com", passwordEncoder.encode("Pass123!"), "Bob", "Architect", Role.CUSTOMER, UserStatus.ACTIVE);
        userRepository.save(userB);
        tokenB = "Bearer " + jwtTokenProvider.generateAccessToken(userB.getId(), userB.getEmail(), userB.getRole());

        Category cat = new Category(UUID.randomUUID().toString(), "Living Room", "living-room", "Living room items", null, 1);
        categoryRepository.save(cat);

        product = new Product();
        product.setId(UUID.randomUUID().toString());
        product.setCategoryId(cat.getId());
        product.setName("Mid-Century Velvet Sofa");
        product.setSlug("mid-century-velvet-sofa");
        product.setBasePrice(new BigDecimal("899.00"));
        product.setStatus("ACTIVE");
        product.setWidthCm(new BigDecimal("210"));
        product.setHeightCm(new BigDecimal("85"));
        product.setDepthCm(new BigDecimal("95"));
        product.setSku("SOFA-MC-01");
        productRepository.save(product);
    }

    @Test
    @DisplayName("TICKET-029: Save Room Design persists name, image reference, and furniture transforms")
    void testSaveRoomDesign() throws Exception {
        String furnitureJson = "[{" +
                "\"id\":\"furn-1\"," +
                "\"productId\":\"" + product.getId() + "\"," +
                "\"name\":\"Mid-Century Velvet Sofa\"," +
                "\"sku\":\"SOFA-MC-01\"," +
                "\"price\":899.00," +
                "\"position\":[0.5, 0.0, -1.2]," +
                "\"rotation\":[0.0, 45.0, 0.0]," +
                "\"scale\":[1.0, 1.0, 1.0]" +
                "}]";

        SaveSessionRequest saveReq = new SaveSessionRequest(
                "Living Room Concept A",
                null,
                "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0",
                furnitureJson
        );

        // POST /api/v1/designs
        mockMvc.perform(post("/api/v1/designs")
                        .header("Authorization", tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(saveReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id").isNotEmpty())
                .andExpect(jsonPath("$.data.name").value("Living Room Concept A"))
                .andExpect(jsonPath("$.data.roomImageUrl").value("https://images.unsplash.com/photo-1600210492486-724fe5c67fb0"))
                .andExpect(jsonPath("$.data.sceneData").value(furnitureJson));
    }

    @Test
    @DisplayName("TICKET-029: Saving design with blank name is rejected with 400 Bad Request")
    void testSaveDesignBlankNameRejected() throws Exception {
        SaveSessionRequest blankReq = new SaveSessionRequest(
                "   ",
                null,
                "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0",
                "[]"
        );

        mockMvc.perform(post("/api/v1/designs")
                        .header("Authorization", tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(blankReq)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TICKET-030: My Designs - list, retrieve, rename, delete and isolate per user")
    void testMyDesignsLifecycleAndIsolation() throws Exception {
        // 1. Create two designs for User A
        SaveSessionRequest design1 = new SaveSessionRequest(
                "Living Room",
                null,
                "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0",
                "[{\"id\":\"furn-1\",\"productId\":\"" + product.getId() + "\",\"position\":[0,0,0]}]"
        );
        SaveSessionRequest design2 = new SaveSessionRequest(
                "New Apartment Bedroom",
                null,
                "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace",
                "[{\"id\":\"furn-2\",\"productId\":\"" + product.getId() + "\",\"position\":[1,0,1]}]"
        );

        String res1 = mockMvc.perform(post("/api/v1/designs")
                        .header("Authorization", tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(design1)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String design1Id = objectMapper.readTree(res1).get("data").get("id").asText();

        mockMvc.perform(post("/api/v1/designs")
                        .header("Authorization", tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(design2)))
                .andExpect(status().isCreated());

        // 2. User A retrieves their designs -> should return 2 designs
        mockMvc.perform(get("/api/v1/designs")
                        .header("Authorization", tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[*].name", containsInAnyOrder("Living Room", "New Apartment Bedroom")));

        // 3. User B retrieves designs -> should return empty list (isolated per user)
        mockMvc.perform(get("/api/v1/designs")
                        .header("Authorization", tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(0)));

        // 4. User B cannot rename User A's design -> 403 Forbidden
        RenameDesignRequest renameReq = new RenameDesignRequest("Master Bedroom Suite");
        mockMvc.perform(patch("/api/v1/designs/" + design1Id + "/rename")
                        .header("Authorization", tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(renameReq)))
                .andExpect(status().isForbidden());

        // 5. User A renames design
        mockMvc.perform(patch("/api/v1/designs/" + design1Id + "/rename")
                        .header("Authorization", tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(renameReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(design1Id))
                .andExpect(jsonPath("$.data.name").value("Master Bedroom Suite"));

        // 6. Renaming with blank name is rejected with 400
        RenameDesignRequest invalidRename = new RenameDesignRequest("  ");
        mockMvc.perform(patch("/api/v1/designs/" + design1Id + "/rename")
                        .header("Authorization", tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRename)))
                .andExpect(status().isBadRequest());

        // 7. Retrieve individual design details (GET /api/v1/designs/{id})
        mockMvc.perform(get("/api/v1/designs/" + design1Id)
                        .header("Authorization", tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(design1Id))
                .andExpect(jsonPath("$.data.name").value("Master Bedroom Suite"))
                .andExpect(jsonPath("$.data.sceneData", containsString("furn-1")));

        // 8. User A deletes design
        mockMvc.perform(delete("/api/v1/designs/" + design1Id)
                        .header("Authorization", tokenA))
                .andExpect(status().isOk());

        // 9. After deletion, User A has only 1 design left
        mockMvc.perform(get("/api/v1/designs")
                        .header("Authorization", tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].name").value("New Apartment Bedroom"));
    }
}
