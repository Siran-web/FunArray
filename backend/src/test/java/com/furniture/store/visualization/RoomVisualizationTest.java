package com.furniture.store.visualization;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.furniture.store.auth.security.JwtTokenProvider;
import com.furniture.store.storage.StorageService;
import com.furniture.store.storage.dto.PresignedUploadRequest;
import com.furniture.store.storage.dto.PresignedUploadResponse;
import com.furniture.store.user.entity.Role;
import com.furniture.store.user.entity.User;
import com.furniture.store.user.entity.UserStatus;
import com.furniture.store.user.repository.UserRepository;
import com.furniture.store.visualization.document.RoomImage;
import com.furniture.store.visualization.document.VisualizationSession;
import com.furniture.store.visualization.dto.CreateRoomImageRequest;
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

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class RoomVisualizationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RoomImageRepository roomImageRepository;

    @Autowired
    private VisualizationSessionRepository sessionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private StorageService storageService;

    private User userA;
    private User userB;
    private String tokenA;
    private String tokenB;

    @BeforeEach
    void setUp() {
        sessionRepository.deleteAll();
        roomImageRepository.deleteAll();
        userRepository.deleteAll();

        // User A
        userA = new User(
                UUID.randomUUID().toString(),
                "usera@furniture.com",
                passwordEncoder.encode("Password123!"),
                "User",
                "Alpha",
                Role.CUSTOMER,
                UserStatus.ACTIVE
        );
        userRepository.save(userA);
        tokenA = "Bearer " + jwtTokenProvider.generateAccessToken(userA.getId(), userA.getEmail(), userA.getRole());

        // User B
        userB = new User(
                UUID.randomUUID().toString(),
                "userb@furniture.com",
                passwordEncoder.encode("Password123!"),
                "User",
                "Beta",
                Role.CUSTOMER,
                UserStatus.ACTIVE
        );
        userRepository.save(userB);
        tokenB = "Bearer " + jwtTokenProvider.generateAccessToken(userB.getId(), userB.getEmail(), userB.getRole());
    }

    // ==========================================
    // TICKET-018: Room Image Upload & Security
    // ==========================================

    @Test
    @DisplayName("TICKET-018: Storage service generates presigned upload URL for ROOM_IMAGE")
    void testPresignedUploadUrlForRoomImage() {
        PresignedUploadRequest req = new PresignedUploadRequest(
                "my_living_room.jpg",
                "image/jpeg",
                2L * 1024 * 1024, // 2MB
                "ROOM_IMAGE"
        );

        PresignedUploadResponse res = storageService.generatePresignedUploadUrl(req);
        assertNotNull(res);
        assertNotNull(res.uploadUrl());
        assertNotNull(res.fileUrl());
        assertTrue(res.fileUrl().contains("rooms/images/"));
        assertEquals("image/jpeg", res.contentType());
    }

    @Test
    @DisplayName("TICKET-018: User can register uploaded room image and retrieve their own images")
    void testCreateAndListRoomImages() throws Exception {
        CreateRoomImageRequest createReq = new CreateRoomImageRequest(
                "Modern Living Room",
                "https://funarray-furniture-storage.s3.amazonaws.com/rooms/images/room1.jpg",
                "rooms/images/room1.jpg",
                2500000L,
                "image/jpeg",
                1920,
                1080
        );

        mockMvc.perform(post("/api/v1/rooms")
                        .header("Authorization", tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("Modern Living Room"))
                .andExpect(jsonPath("$.data.imageUrl").value("https://funarray-furniture-storage.s3.amazonaws.com/rooms/images/room1.jpg"))
                .andExpect(jsonPath("$.data.width").value(1920));

        // Fetch User A's room images
        mockMvc.perform(get("/api/v1/rooms")
                        .header("Authorization", tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].name").value("Modern Living Room"));

        // User B sees 0 room images
        mockMvc.perform(get("/api/v1/rooms")
                        .header("Authorization", tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(0)));
    }

    @Test
    @DisplayName("TICKET-018: User B cannot access or delete User A's private room image")
    void testUserCannotAccessAnotherUsersRoomImage() throws Exception {
        // Create room image owned by User A
        RoomImage imageA = new RoomImage(
                UUID.randomUUID().toString(),
                userA,
                "Private Bedroom",
                "https://storage.com/rooms/bedroom.jpg",
                "rooms/bedroom.jpg",
                1200000L,
                "image/jpeg",
                1920,
                1080
        );
        roomImageRepository.save(imageA);

        // User B tries to view User A's room image -> 403 Forbidden
        mockMvc.perform(get("/api/v1/rooms/" + imageA.getId())
                        .header("Authorization", tokenB))
                .andExpect(status().isForbidden());

        // User B tries to delete User A's room image -> 403 Forbidden
        mockMvc.perform(delete("/api/v1/rooms/" + imageA.getId())
                        .header("Authorization", tokenB))
                .andExpect(status().isForbidden());

        // Ensure image still exists
        assertTrue(roomImageRepository.existsById(imageA.getId()));
    }

    // ========================================================
    // TICKET-019 & TICKET-020: Visualization Canvas & Placement
    // ========================================================

    @Test
    @DisplayName("TICKET-019 & TICKET-020: User can save and retrieve 3D furniture placement session")
    void testSaveAndRetrieveVisualizationSession() throws Exception {
        String sceneJson = """
                [
                  {
                    "id": "item-1",
                    "productId": "prod-101",
                    "modelUrl": "https://storage.com/models/armchair.glb",
                    "position": [0, 0, 0],
                    "rotation": [0, 45, 0],
                    "scale": [1, 1, 1],
                    "dimensions": {"widthCm": 85, "heightCm": 90, "depthCm": 80}
                  },
                  {
                    "id": "item-2",
                    "productId": "prod-202",
                    "modelUrl": "https://storage.com/models/coffee-table.glb",
                    "position": [1.5, 0, 0.5],
                    "rotation": [0, 0, 0],
                    "scale": [1, 1, 1],
                    "dimensions": {"widthCm": 120, "heightCm": 45, "depthCm": 60}
                  }
                ]
                """;

        SaveSessionRequest saveReq = new SaveSessionRequest(
                "My Dream Living Room",
                null,
                "https://storage.com/rooms/living.jpg",
                sceneJson
        );

        String responseJson = mockMvc.perform(post("/api/v1/visualization/sessions")
                        .header("Authorization", tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(saveReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("My Dream Living Room"))
                .andExpect(jsonPath("$.data.sceneData", containsString("prod-101")))
                .andExpect(jsonPath("$.data.sceneData", containsString("prod-202")))
                .andReturn().getResponse().getContentAsString();

        String sessionId = objectMapper.readTree(responseJson).get("data").get("id").asText();

        // Retrieve saved session
        mockMvc.perform(get("/api/v1/visualization/sessions/" + sessionId)
                        .header("Authorization", tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("My Dream Living Room"))
                .andExpect(jsonPath("$.data.roomImageUrl").value("https://storage.com/rooms/living.jpg"));

        // List user sessions
        mockMvc.perform(get("/api/v1/visualization/sessions")
                        .header("Authorization", tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)));
    }
}
