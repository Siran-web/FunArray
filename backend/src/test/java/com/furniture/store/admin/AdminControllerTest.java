package com.furniture.store.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.furniture.store.auth.security.JwtTokenProvider;
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

import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    private User adminUser;
    private User customerUser;
    private String adminToken;
    private String customerToken;

    @BeforeEach
    void setUp() {
        String adminEmail = "admin_" + UUID.randomUUID() + "@furniture.com";
        adminUser = new User(adminEmail, passwordEncoder.encode("Password123!"), "Super", "Admin", "+919876543210", Role.ADMIN, UserStatus.ACTIVE);
        adminUser = userRepository.save(adminUser);
        adminToken = jwtTokenProvider.generateAccessToken(adminUser.getId(), adminUser.getEmail(), adminUser.getRole());

        String customerEmail = "customer_" + UUID.randomUUID() + "@furniture.com";
        customerUser = new User(customerEmail, passwordEncoder.encode("Password123!"), "John", "Customer", "+919876543211", Role.CUSTOMER, UserStatus.ACTIVE);
        customerUser = userRepository.save(customerUser);
        customerToken = jwtTokenProvider.generateAccessToken(customerUser.getId(), customerUser.getEmail(), customerUser.getRole());
    }

    @AfterEach
    void tearDown() {
        userRepository.deleteById(adminUser.getId());
        userRepository.deleteById(customerUser.getId());
    }

    @Test
    @DisplayName("TICKET-032: CUSTOMER is rejected when trying to access /admin/dashboard with 403 Forbidden")
    void customerCannotAccessAdminDashboard() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("TICKET-032: Unauthenticated request to /admin/dashboard is rejected with 401 Unauthorized")
    void unauthenticatedCannotAccessAdminDashboard() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("TICKET-032: ADMIN can successfully retrieve system metrics from /admin/dashboard")
    void adminCanAccessDashboardMetrics() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalSales").isNumber())
                .andExpect(jsonPath("$.data.totalOrders").isNumber())
                .andExpect(jsonPath("$.data.activeProducts").isNumber())
                .andExpect(jsonPath("$.data.totalCustomers").isNumber());
    }

    @Test
    @DisplayName("TICKET-032: ADMIN can access customer directory from /admin/customers")
    void adminCanAccessCustomerList() throws Exception {
        mockMvc.perform(get("/api/v1/admin/customers")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(2))));
    }

    @Test
    @DisplayName("TICKET-032: ADMIN can access inventory overview from /admin/inventory")
    void adminCanAccessInventoryOverview() throws Exception {
        mockMvc.perform(get("/api/v1/admin/inventory")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.warehouseLocations").isNumber());
    }
}
