package com.furniture.store.storage;

import com.furniture.store.auth.security.UserPrincipal;
import com.furniture.store.common.ApiResponse;
import com.furniture.store.exception.ForbiddenException;
import com.furniture.store.storage.dto.PresignedUploadRequest;
import com.furniture.store.storage.dto.PresignedUploadResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/storage", "/api/storage"})
@Tag(name = "Storage", description = "S3 Direct Presigned Upload URLs for images and 3D GLB models")
public class StorageController {

    private final StorageService storageService;

    public StorageController(StorageService storageService) {
        this.storageService = storageService;
    }

    @PostMapping("/presigned-upload-url")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Generate short-lived presigned URL for direct browser S3 upload")
    public ResponseEntity<ApiResponse<PresignedUploadResponse>> getPresignedUploadUrl(
            @Valid @RequestBody PresignedUploadRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        String resourceType = request.resourceType().trim().toUpperCase();
        if (("PRODUCT_IMAGE".equals(resourceType) || "3D_MODEL".equals(resourceType))) {
            boolean isAdmin = principal != null && principal.getAuthorities().stream()
                    .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
            if (!isAdmin) {
                throw new ForbiddenException("Only administrators are permitted to generate upload URLs for catalog assets.");
            }
        }

        PresignedUploadResponse response = storageService.generatePresignedUploadUrl(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
