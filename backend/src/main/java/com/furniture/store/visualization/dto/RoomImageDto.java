package com.furniture.store.visualization.dto;

import java.time.Instant;

public record RoomImageDto(
        String id,
        String userId,
        String name,
        String imageUrl,
        String fileKey,
        Long fileSize,
        String mimeType,
        Integer width,
        Integer height,
        Instant createdAt
) {}
