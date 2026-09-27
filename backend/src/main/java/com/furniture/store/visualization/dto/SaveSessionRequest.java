package com.furniture.store.visualization.dto;

import jakarta.validation.constraints.NotBlank;

public record SaveSessionRequest(
        @NotBlank(message = "Design name is required")
        String name,
        String roomImageId,
        String roomImageUrl,
        @NotBlank(message = "Scene data is required")
        String sceneData
) {}
