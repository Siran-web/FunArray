package com.furniture.store.storage.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record PresignedUploadRequest(
        @NotBlank(message = "Filename is required")
        @Size(max = 255, message = "Filename must not exceed 255 characters")
        String filename,

        @NotBlank(message = "Content type is required")
        String contentType,

        @NotNull(message = "File size is required")
        @Min(value = 1, message = "File size must be greater than 0")
        Long fileSize,

        @NotBlank(message = "Resource type is required (e.g. PRODUCT_IMAGE, 3D_MODEL, ROOM_SCAN)")
        String resourceType
) {}
