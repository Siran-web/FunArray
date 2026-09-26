package com.furniture.store.visualization.dto;

import java.time.Instant;

public record VisualizationSessionDto(
        String id,
        String userId,
        String roomImageId,
        String roomImageUrl,
        String name,
        String sceneData,
        Instant createdAt,
        Instant updatedAt
) {}
