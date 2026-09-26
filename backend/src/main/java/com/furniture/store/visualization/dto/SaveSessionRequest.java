package com.furniture.store.visualization.dto;

import jakarta.validation.constraints.NotBlank;

public record SaveSessionRequest(
        String name,
        String roomImageId,
        String roomImageUrl,
        @NotBlank(message = "Scene data is required")
        String sceneData
) {}
