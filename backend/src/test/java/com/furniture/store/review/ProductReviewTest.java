package com.furniture.store.review;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.furniture.store.auth.security.JwtTokenProvider;
import com.furniture.store.category.Category;
import com.furniture.store.category.CategoryRepository;
import com.furniture.store.product.entity.Product;
import com.furniture.store.product.repository.ProductRepository;
import com.furniture.store.review.dto.CreateReviewRequest;
import com.furniture.store.review.repository.ReviewRepository;
import com.furniture.store.user.entity.Role;
import com.furniture.store.user.entity.User;
import com.furniture.store.user.entity.UserStatus;
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
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ProductReviewTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ReviewRepository reviewRepository;

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

    private User customerA;
    private User customerB;
    private User admin;
    private String tokenA;
    private String tokenB;
    private String tokenAdmin;
    private Product product;

    @AfterEach
    void tearDown() {
        reviewRepository.deleteAll();
        productRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();
    }

    @BeforeEach
    void setUp() {
        reviewRepository.deleteAll();
        productRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();

        customerA = new User("reviewer_a@furniture.com", passwordEncoder.encode("Pass123!"), "Alice", "Walker", null, Role.CUSTOMER, UserStatus.ACTIVE);
        userRepository.save(customerA);
        tokenA = "Bearer " + jwtTokenProvider.generateAccessToken(customerA.getId(), customerA.getEmail(), customerA.getRole());

        customerB = new User("reviewer_b@furniture.com", passwordEncoder.encode("Pass123!"), "Bob", "Smith", null, Role.CUSTOMER, UserStatus.ACTIVE);
        userRepository.save(customerB);
        tokenB = "Bearer " + jwtTokenProvider.generateAccessToken(customerB.getId(), customerB.getEmail(), customerB.getRole());

        admin = new User("admin_reviews@furniture.com", passwordEncoder.encode("AdminPass123!"), "Admin", "User", null, Role.ADMIN, UserStatus.ACTIVE);
        userRepository.save(admin);
        tokenAdmin = "Bearer " + jwtTokenProvider.generateAccessToken(admin.getId(), admin.getEmail(), admin.getRole());

        Category cat = new Category(UUID.randomUUID().toString(), "Living Room", "living-room", "Living room items", null, 1);
        categoryRepository.save(cat);

        product = new Product();
        product.setId(UUID.randomUUID().toString());
        product.setCategoryId(cat.getId());
        product.setName("Kanso 3-Seater Sofa");
        product.setSlug("kanso-3-seater-sofa");
        product.setBasePrice(new BigDecimal("78999.00"));
        product.setStatus("ACTIVE");
        product.setWidthCm(new BigDecimal("210"));
        product.setHeightCm(new BigDecimal("85"));
        product.setDepthCm(new BigDecimal("90"));
        product.setSku("SOFA-KANSO-01");
        productRepository.save(product);
    }

    @Test
    @DisplayName("TICKET-031: Authenticated customer can submit product review with rating, title, and comment")
    void testCustomerCanSubmitReview() throws Exception {
        CreateReviewRequest request = new CreateReviewRequest(
                5,
                "Exceptional Craftsmanship & Finish",
                "The solid oak frame and linen upholstery exceeded expectations. Visualized perfectly in my living room."
        );

        mockMvc.perform(post("/api/v1/products/" + product.getId() + "/reviews")
                        .header("Authorization", tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id").isNotEmpty())
                .andExpect(jsonPath("$.data.productId").value(product.getId()))
                .andExpect(jsonPath("$.data.userId").value(customerA.getId()))
                .andExpect(jsonPath("$.data.userName").value("Alice Walker"))
                .andExpect(jsonPath("$.data.rating").value(5))
                .andExpect(jsonPath("$.data.title").value("Exceptional Craftsmanship & Finish"))
                .andExpect(jsonPath("$.data.comment", containsString("solid oak frame")))
                .andExpect(jsonPath("$.data.status").value("PUBLISHED"));
    }

    @Test
    @DisplayName("TICKET-031: Unauthenticated review submission is rejected with 401 Unauthorized")
    void testUnauthenticatedReviewRejected() throws Exception {
        CreateReviewRequest request = new CreateReviewRequest(
                4,
                "Great piece",
                "Looks great in my room."
        );

        mockMvc.perform(post("/api/v1/products/" + product.getId() + "/reviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("TICKET-031: Invalid rating (< 1 or > 5) is rejected with 400 Bad Request")
    void testInvalidRatingRejected() throws Exception {
        CreateReviewRequest invalidLow = new CreateReviewRequest(0, "Title", "Comment");
        mockMvc.perform(post("/api/v1/products/" + product.getId() + "/reviews")
                        .header("Authorization", tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidLow)))
                .andExpect(status().isBadRequest());

        CreateReviewRequest invalidHigh = new CreateReviewRequest(6, "Title", "Comment");
        mockMvc.perform(post("/api/v1/products/" + product.getId() + "/reviews")
                        .header("Authorization", tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidHigh)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TICKET-031: Public product review summary endpoint returns reviews, average rating, and distribution")
    void testGetProductReviewsSummary() throws Exception {
        // Customer A submits a 5-star review
        CreateReviewRequest reviewA = new CreateReviewRequest(5, "Perfect", "Loved the linen fabric");
        mockMvc.perform(post("/api/v1/products/" + product.getId() + "/reviews")
                        .header("Authorization", tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewA)))
                .andExpect(status().isCreated());

        // Customer B submits a 4-star review
        CreateReviewRequest reviewB = new CreateReviewRequest(4, "Very Good", "Slightly firm at first but great ergonomics");
        mockMvc.perform(post("/api/v1/products/" + product.getId() + "/reviews")
                        .header("Authorization", tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewB)))
                .andExpect(status().isCreated());

        // Public retrieval (GET /api/v1/products/{id}/reviews)
        mockMvc.perform(get("/api/v1/products/" + product.getId() + "/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalReviews").value(2))
                .andExpect(jsonPath("$.data.averageRating").value(4.5))
                .andExpect(jsonPath("$.data.reviews", hasSize(2)))
                .andExpect(jsonPath("$.data.reviews[*].userName", containsInAnyOrder("Alice Walker", "Bob Smith")))
                .andExpect(jsonPath("$.data.ratingDistribution.5").value(1))
                .andExpect(jsonPath("$.data.ratingDistribution.4").value(1));
    }

    @Test
    @DisplayName("TICKET-031: Customer cannot delete another customer's review, but can delete own review")
    void testReviewOwnershipAndDeletion() throws Exception {
        // Customer A submits a review
        CreateReviewRequest req = new CreateReviewRequest(5, "Awesome", "Superb comfort");
        String res = mockMvc.perform(post("/api/v1/products/" + product.getId() + "/reviews")
                        .header("Authorization", tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String reviewId = objectMapper.readTree(res).get("data").get("id").asText();

        // Customer B tries to delete Customer A's review -> 403 Forbidden
        mockMvc.perform(delete("/api/v1/reviews/" + reviewId)
                        .header("Authorization", tokenB))
                .andExpect(status().isForbidden());

        // Customer A deletes own review -> 200 OK
        mockMvc.perform(delete("/api/v1/reviews/" + reviewId)
                        .header("Authorization", tokenA))
                .andExpect(status().isOk());

        // Verify reviews list is now empty
        mockMvc.perform(get("/api/v1/products/" + product.getId() + "/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalReviews").value(0));
    }
}
