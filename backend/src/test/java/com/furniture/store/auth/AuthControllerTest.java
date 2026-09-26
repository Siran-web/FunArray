package com.furniture.store.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.furniture.store.auth.dto.LoginRequest;
import com.furniture.store.auth.dto.RefreshTokenRequest;
import com.furniture.store.auth.dto.RegisterRequest;
import com.furniture.store.user.entity.Role;
import com.furniture.store.user.entity.User;
import com.furniture.store.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    // ==========================================
    // TICKET-004: User Registration Tests
    // ==========================================

    @Test
    @DisplayName("TICKET-004: Valid customer registration succeeds, hashes password, assigns default role, hides password")
    void testRegisterSuccess() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "rahul.sharma@example.com",
                "StrongP@ss123",
                "Rahul",
                "Sharma",
                "+919876543210"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.refreshToken", notNullValue()))
                .andExpect(jsonPath("$.data.tokenType", is("Bearer")))
                .andExpect(jsonPath("$.data.user.email", is("rahul.sharma@example.com")))
                .andExpect(jsonPath("$.data.user.firstName", is("Rahul")))
                .andExpect(jsonPath("$.data.user.lastName", is("Sharma")))
                .andExpect(jsonPath("$.data.user.role", is("CUSTOMER")))
                .andExpect(jsonPath("$.data.user.password").doesNotExist())
                .andExpect(jsonPath("$.data.user.passwordHash").doesNotExist());

        User user = userRepository.findByEmailIgnoreCase("rahul.sharma@example.com").orElse(null);
        assertNotNull(user, "User must be persisted in database");
        assertTrue(user.getPasswordHash().startsWith("$2a$") || user.getPasswordHash().startsWith("$2b$"),
                "Password must be securely hashed with BCrypt");
        assertNotEquals("StrongP@ss123", user.getPasswordHash(), "Plaintext password must NEVER be stored");
        assertEquals(Role.CUSTOMER, user.getRole(), "Default role must be CUSTOMER");
    }

    @Test
    @DisplayName("TICKET-004: Duplicate email registration is rejected with 409 Conflict")
    void testRegisterDuplicateEmailRejected() throws Exception {
        RegisterRequest first = new RegisterRequest(
                "duplicate@example.com",
                "Password123!",
                "First",
                "User",
                "+919876543210"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(first)))
                .andExpect(status().isCreated());

        RegisterRequest duplicate = new RegisterRequest(
                "DUPLICATE@EXAMPLE.COM", // case insensitive check
                "DifferentPassword123!",
                "Second",
                "User",
                "+919876543211"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicate)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("DUPLICATE_RESOURCE")));
    }

    @Test
    @DisplayName("TICKET-004: Short password (< 8 chars) fails input validation with 400 Bad Request")
    void testRegisterValidationFailureShortPassword() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "short.pass@example.com",
                "short",
                "Short",
                "Pass",
                null
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("VALIDATION_ERROR")))
                .andExpect(jsonPath("$.error.fieldErrors.password", notNullValue()));
    }

    @Test
    @DisplayName("TICKET-004: Invalid email format fails input validation with 400 Bad Request")
    void testRegisterValidationFailureInvalidEmail() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "invalid-email-address",
                "ValidPassword123!",
                "First",
                "Last",
                null
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("VALIDATION_ERROR")))
                .andExpect(jsonPath("$.error.fieldErrors.email", notNullValue()));
    }

    // ==========================================
    // TICKET-005: JWT Login, Refresh & Logout Tests
    // ==========================================

    @Test
    @DisplayName("TICKET-005: Valid login returns access and refresh tokens, user summary without password")
    void testLoginSuccess() throws Exception {
        RegisterRequest registerReq = new RegisterRequest(
                "login.test@example.com",
                "ValidSecret123!",
                "Login",
                "User",
                null
        );
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)));

        LoginRequest loginReq = new LoginRequest("login.test@example.com", "ValidSecret123!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.refreshToken", notNullValue()))
                .andExpect(jsonPath("$.data.user.email", is("login.test@example.com")))
                .andExpect(jsonPath("$.data.user.password").doesNotExist());
    }

    @Test
    @DisplayName("TICKET-005: Invalid password returns 401 Unauthorized with generic message to avoid enumeration")
    void testLoginInvalidPassword() throws Exception {
        RegisterRequest registerReq = new RegisterRequest(
                "wrong.pass@example.com",
                "ValidSecret123!",
                "Wrong",
                "Password",
                null
        );
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)));

        LoginRequest loginReq = new LoginRequest("wrong.pass@example.com", "IncorrectPassword123!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.message", is("Email or password is incorrect.")));
    }

    @Test
    @DisplayName("TICKET-005: Unregistered email returns identical 401 error to avoid user enumeration")
    void testLoginUnregisteredUser() throws Exception {
        LoginRequest loginReq = new LoginRequest("doesnotexist@example.com", "AnyPassword123!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.message", is("Email or password is incorrect.")));
    }

    @Test
    @DisplayName("TICKET-005: Token refresh flow works and produces new valid tokens")
    void testTokenRefreshFlow() throws Exception {
        RegisterRequest registerReq = new RegisterRequest(
                "refresh.test@example.com",
                "RefreshSecret123!",
                "Refresh",
                "Tester",
                null
        );
        MvcResult regResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andReturn();

        String rawJson = regResult.getResponse().getContentAsString();
        String refreshToken = objectMapper.readTree(rawJson).get("data").get("refreshToken").asText();

        RefreshTokenRequest refreshReq = new RefreshTokenRequest(refreshToken);

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.refreshToken", notNullValue()));
    }

    @Test
    @DisplayName("TICKET-005: Logout revokes active tokens and rejects subsequent requests")
    void testLogoutRevokesToken() throws Exception {
        RegisterRequest registerReq = new RegisterRequest(
                "logout.test@example.com",
                "LogoutSecret123!",
                "Logout",
                "Tester",
                null
        );
        MvcResult regResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andReturn();

        String rawJson = regResult.getResponse().getContentAsString();
        String accessToken = objectMapper.readTree(rawJson).get("data").get("accessToken").asText();

        // 1. Verify token works initially on protected endpoint
        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());

        // 2. Perform logout
        mockMvc.perform(post("/api/v1/auth/logout")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.message", is("Logged out successfully")));

        // 3. Verify revoked token is now rejected with 401 Unauthorized
        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isUnauthorized());
    }
}
