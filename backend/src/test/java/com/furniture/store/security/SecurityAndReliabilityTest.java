package com.furniture.store.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.furniture.store.auth.dto.LoginRequest;
import com.furniture.store.auth.dto.RegisterRequest;
import com.furniture.store.config.CorrelationIdFilter;
import com.furniture.store.config.RateLimitingFilter;
import com.furniture.store.storage.StorageService;
import com.furniture.store.storage.dto.PresignedUploadRequest;
import com.furniture.store.storage.dto.PresignedUploadResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class SecurityAndReliabilityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private StorageService storageService;

    @Test
    @DisplayName("TICKET-036: Validation errors return 400 with fieldErrors and consistent structure")
    void shouldReturnValidationErrorsWithFieldMap() throws Exception {
        RegisterRequest invalidRequest = new RegisterRequest("invalid-email", "short", "", "", null);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("VALIDATION_ERROR")))
                .andExpect(jsonPath("$.error.fieldErrors", notNullValue()))
                .andExpect(jsonPath("$.stackTrace").doesNotExist());
    }

    @Test
    @DisplayName("TICKET-036: Bad credentials returns 401 with standard error")
    void shouldReturnUnauthorizedForBadCredentials() throws Exception {
        LoginRequest badLogin = new LoginRequest("nonexistent@example.com", "WrongPassword123!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(badLogin)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.code", is("UNAUTHORIZED")))
                .andExpect(jsonPath("$.stackTrace").doesNotExist());
    }

    @Test
    @DisplayName("TICKET-036: Requesting non-existent entity returns 404")
    void shouldReturn404ForMissingResource() throws Exception {
        mockMvc.perform(get("/api/v1/products/non-existent-product-id-999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)))
                .andExpect(jsonPath("$.error.message", notNullValue()));
    }

    @Test
    @DisplayName("TICKET-037: Upload Security - Valid upload request returns presigned URL")
    void shouldGeneratePresignedUploadUrlForValidImage() {
        PresignedUploadRequest request = new PresignedUploadRequest(
                "living-room.jpg",
                "image/jpeg",
                1024L * 500L, // 500 KB
                "ROOM_IMAGE"
        );

        PresignedUploadResponse response = storageService.generatePresignedUploadUrl(request);
        assertThat(response).isNotNull();
        assertThat(response.uploadUrl()).contains("funarray-furniture-storage");
        assertThat(response.fileUrl()).contains("rooms/images/");
        assertThat(response.contentType()).isEqualTo("image/jpeg");
    }

    @Test
    @DisplayName("TICKET-037: Upload Security - Rejects prohibited MIME types")
    void shouldRejectProhibitedMimeTypes() {
        PresignedUploadRequest request = new PresignedUploadRequest(
                "script.exe",
                "application/x-msdownload",
                1024L,
                "PRODUCT_IMAGE"
        );

        assertThatThrownBy(() -> storageService.generatePresignedUploadUrl(request))
                .isInstanceOf(com.furniture.store.exception.BadRequestException.class)
                .hasMessageContaining("Invalid content type");
    }

    @Test
    @DisplayName("TICKET-037: Upload Security - Rejects oversized files")
    void shouldRejectOversizedFiles() {
        PresignedUploadRequest request = new PresignedUploadRequest(
                "large-photo.png",
                "image/png",
                StorageService.MAX_IMAGE_SIZE + 1024L,
                "PRODUCT_IMAGE"
        );

        assertThatThrownBy(() -> storageService.generatePresignedUploadUrl(request))
                .isInstanceOf(com.furniture.store.exception.BadRequestException.class)
                .hasMessageContaining("exceeds maximum allowed limit");
    }

    @Test
    @DisplayName("TICKET-037: Upload Security - Sanitizes malicious directory traversal filenames")
    void shouldSanitizeTraversalFilenames() {
        PresignedUploadRequest request = new PresignedUploadRequest(
                "../../../../etc/passwd.jpg",
                "image/jpeg",
                1024L,
                "ROOM_IMAGE"
        );

        PresignedUploadResponse response = storageService.generatePresignedUploadUrl(request);
        assertThat(response.key()).doesNotContain("..");
        assertThat(response.key()).doesNotContain("etc");
        assertThat(response.key()).contains("passwd.jpg");
    }

    @Test
    @DisplayName("TICKET-038: Rate Limiting - Throttle excessive requests with 429 and Retry-After")
    void shouldRateLimitExcessiveAuthRequests() throws Exception {
        LoginRequest req = new LoginRequest("test@example.com", "Password123!");
        String body = objectMapper.writeValueAsString(req);

        // Send enough requests from same IP to exceed auth limit (30 req/min)
        boolean hitRateLimit = false;
        for (int i = 0; i < RateLimitingFilter.AUTH_LIMIT_PER_MINUTE + 5; i++) {
            var result = mockMvc.perform(post("/api/v1/auth/login")
                            .header("X-Forwarded-For", "192.168.100.50")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andReturn();

            if (result.getResponse().getStatus() == 429) {
                hitRateLimit = true;
                assertThat(result.getResponse().getHeader("Retry-After")).isEqualTo("60");
                break;
            }
        }
        assertThat(hitRateLimit).isTrue();
    }

    @Test
    @DisplayName("TICKET-039: Observability - X-Request-ID is generated and attached to response headers")
    void shouldAttachCorrelationIdHeader() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(header().exists(CorrelationIdFilter.REQUEST_ID_HEADER))
                .andExpect(header().exists(CorrelationIdFilter.CORRELATION_ID_HEADER));
    }

    @Test
    @DisplayName("TICKET-039: Observability - Health endpoint reports status and database connectivity")
    void shouldReturnHealthStatusWithDatabaseComponent() throws Exception {
        mockMvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.status", is("UP")))
                .andExpect(jsonPath("$.data.components.database.status", is("UP")));
    }
}
