package com.furniture.store.visualization.dto;

import jakarta.validation.constraints.NotBlank;
import org.hibernate.validator.constraints.URL;

public record CreateRoomImageRequest(
        String name,
        @NotBlank(message = "Image URL is required")
        String imageUrl,
        String fileKey,
        Long fileSize,
        String mimeType,
        Integer width,
        Integer height
) {}
