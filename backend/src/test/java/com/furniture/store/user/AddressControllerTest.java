package com.furniture.store.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.furniture.store.auth.security.JwtTokenProvider;
import com.furniture.store.user.dto.CreateAddressRequest;
import com.furniture.store.user.dto.UpdateAddressRequest;
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

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AddressControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User userA;
    private User userB;
    private String tokenA;
    private String tokenB;

    @BeforeEach
    void setUp() {
        addressRepository.deleteAll();
        userRepository.deleteAll();

        userA = new User("userA@store.com", passwordEncoder.encode("Pass123!"), "Alice", "Smith", "+919876543210", Role.CUSTOMER, UserStatus.ACTIVE);
        userA = userRepository.save(userA);
        tokenA = tokenProvider.generateAccessToken(userA.getId(), userA.getEmail(), userA.getRole());

        userB = new User("userB@store.com", passwordEncoder.encode("Pass123!"), "Bob", "Jones", "+919876543211", Role.CUSTOMER, UserStatus.ACTIVE);
        userB = userRepository.save(userB);
        tokenB = tokenProvider.generateAccessToken(userB.getId(), userB.getEmail(), userB.getRole());
    }

    @Test
    @DisplayName("TICKET-007: Authenticated user can create shipping address with server-side ownership enforcement")
    void testCreateAddressSuccess() throws Exception {
        CreateAddressRequest request = new CreateAddressRequest(
                "Plot 101, Model Town",
                "Near City Center",
                "Jalandhar",
                "Punjab",
                "144003",
                "India",
                true
        );

        mockMvc.perform(post("/api/v1/addresses")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.id", notNullValue()))
                .andExpect(jsonPath("$.data.addressLine1", is("Plot 101, Model Town")))
                .andExpect(jsonPath("$.data.city", is("Jalandhar")))
                .andExpect(jsonPath("$.data.isDefault", is(true)));

        List<Address> addresses = addressRepository.findByUserIdOrderByCreatedAtDesc(userA.getId());
        assertEquals(1, addresses.size());
        assertEquals(userA.getId(), addresses.get(0).getUser().getId(), "Ownership must strictly match userA");
    }

    @Test
    @DisplayName("TICKET-007: Required address fields are validated (blank addressLine1/city/state/postalCode returns 400)")
    void testCreateAddressValidationFailure() throws Exception {
        CreateAddressRequest invalid = new CreateAddressRequest(
                "", // Blank
                null,
                "", // Blank
                "", // Blank
                "", // Blank
                "India",
                false
        );

        mockMvc.perform(post("/api/v1/addresses")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("VALIDATION_ERROR")))
                .andExpect(jsonPath("$.error.fieldErrors.addressLine1", notNullValue()))
                .andExpect(jsonPath("$.error.fieldErrors.city", notNullValue()));
    }

    @Test
    @DisplayName("TICKET-007: User cannot access another user's address (IDOR protection returns HTTP 403 Forbidden)")
    void testUserCannotAccessAnotherUsersAddress() throws Exception {
        // Create an address belonging to User A
        Address addrA = new Address(userA, "User A Street", null, "Delhi", "Delhi", "110001", "India", true);
        addrA = addressRepository.save(addrA);

        // User B attempts to read User A's address by ID
        mockMvc.perform(get("/api/v1/addresses/" + addrA.getId())
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("FORBIDDEN")));

        // User B attempts to update User A's address
        UpdateAddressRequest updateReq = new UpdateAddressRequest(
                "Hacked Street", null, "Delhi", "Delhi", "110001", "India", false
        );
        mockMvc.perform(put("/api/v1/addresses/" + addrA.getId())
                        .header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isForbidden());

        // User B attempts to delete User A's address
        mockMvc.perform(delete("/api/v1/addresses/" + addrA.getId())
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isForbidden());

        // Verify address remains untouched
        assertTrue(addressRepository.findById(addrA.getId()).isPresent());
    }

    @Test
    @DisplayName("TICKET-007: User can update their own address")
    void testUserCanUpdateOwnAddress() throws Exception {
        Address addrA = new Address(userA, "Initial Address", null, "Mumbai", "Maharashtra", "400001", "India", false);
        addrA = addressRepository.save(addrA);

        UpdateAddressRequest updateReq = new UpdateAddressRequest(
                "Updated Luxury Villa", "Suite 500", "Mumbai", "Maharashtra", "400002", "India", true
        );

        mockMvc.perform(put("/api/v1/addresses/" + addrA.getId())
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.addressLine1", is("Updated Luxury Villa")))
                .andExpect(jsonPath("$.data.addressLine2", is("Suite 500")))
                .andExpect(jsonPath("$.data.postalCode", is("400002")));
    }

    @Test
    @DisplayName("TICKET-007: User can delete their own address")
    void testUserCanDeleteOwnAddress() throws Exception {
        Address addrA = new Address(userA, "Address To Delete", null, "Pune", "Maharashtra", "411001", "India", false);
        addrA = addressRepository.save(addrA);

        mockMvc.perform(delete("/api/v1/addresses/" + addrA.getId())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.message", is("Address deleted successfully")));

        assertFalse(addressRepository.findById(addrA.getId()).isPresent());
    }

    @Test
    @DisplayName("TICKET-007: Only one address can be default; setting a new default unsets previous default")
    void testSingleDefaultAddressEnforcement() throws Exception {
        // Create first address (default)
        CreateAddressRequest first = new CreateAddressRequest(
                "First Home", null, "Chandigarh", "Chandigarh", "160001", "India", true
        );
        MvcResult res1 = mockMvc.perform(post("/api/v1/addresses")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(first)))
                .andExpect(status().isCreated())
                .andReturn();
        String id1 = objectMapper.readTree(res1.getResponse().getContentAsString()).get("data").get("id").asText();

        // Create second address also marked as default
        CreateAddressRequest second = new CreateAddressRequest(
                "Second Office", null, "Chandigarh", "Chandigarh", "160002", "India", true
        );
        MvcResult res2 = mockMvc.perform(post("/api/v1/addresses")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(second)))
                .andExpect(status().isCreated())
                .andReturn();
        String id2 = objectMapper.readTree(res2.getResponse().getContentAsString()).get("data").get("id").asText();

        // Verify id2 is now default, and id1 is no longer default
        Address addr1 = addressRepository.findById(id1).orElseThrow();
        Address addr2 = addressRepository.findById(id2).orElseThrow();

        assertFalse(addr1.getIsDefault(), "First address must be unset from default");
        assertTrue(addr2.getIsDefault(), "Second address must be set to default");
    }
}
