package com.furniture.store.auth;

import com.furniture.store.auth.security.JwtTokenProvider;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class RoleBasedAuthorizationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String customerToken;
    private String staffToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();

        User customer = new User("cust@store.com", passwordEncoder.encode("Pass123!"), "Cust", "Omer", null, Role.CUSTOMER, UserStatus.ACTIVE);
        userRepository.save(customer);
        customerToken = tokenProvider.generateAccessToken(customer.getId(), customer.getEmail(), customer.getRole());

        User staff = new User("staff@store.com", passwordEncoder.encode("Pass123!"), "Staff", "Member", null, Role.STAFF, UserStatus.ACTIVE);
        userRepository.save(staff);
        staffToken = tokenProvider.generateAccessToken(staff.getId(), staff.getEmail(), staff.getRole());

        User admin = new User("admin@store.com", passwordEncoder.encode("Pass123!"), "Store", "Admin", null, Role.ADMIN, UserStatus.ACTIVE);
        userRepository.save(admin);
        adminToken = tokenProvider.generateAccessToken(admin.getId(), admin.getEmail(), admin.getRole());
    }

    @Test
    @DisplayName("TICKET-006: Unauthenticated request to protected endpoint returns HTTP 401 Unauthorized")
    void testUnauthenticatedReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("UNAUTHORIZED")));
    }

    @Test
    @DisplayName("TICKET-006: CUSTOMER cannot access admin APIs -> returns HTTP 403 Forbidden")
    void testCustomerCannotAccessAdminApi() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("FORBIDDEN")));
    }

    @Test
    @DisplayName("TICKET-006: STAFF cannot access admin APIs -> returns HTTP 403 Forbidden")
    void testStaffCannotAccessAdminApi() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("FORBIDDEN")));
    }

    @Test
    @DisplayName("TICKET-006: ADMIN can access administrative APIs -> returns HTTP 200 OK")
    void testAdminCanAccessAdminApi() throws Exception {
        mockMvc.perform(get("/api/v1/admin/dashboard")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.totalOrders", is(124)));
    }

    @Test
    @DisplayName("TICKET-006: STAFF can access explicitly permitted staff operations -> returns HTTP 200 OK")
    void testStaffCanAccessStaffOperations() throws Exception {
        mockMvc.perform(get("/api/v1/staff/tasks")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("OPERATIONAL")));
    }

    @Test
    @DisplayName("TICKET-006: CUSTOMER cannot access staff operations -> returns HTTP 403 Forbidden")
    void testCustomerCannotAccessStaffOperations() throws Exception {
        mockMvc.perform(get("/api/v1/staff/tasks")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("FORBIDDEN")));
    }
}
