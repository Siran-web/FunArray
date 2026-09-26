package com.furniture.store.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;

public record SaveFurnitureModelRequest(
        @NotBlank(message = "Model URL is required")
        String modelUrl,

        String thumbnailUrl,

        @Pattern(regexp = "(?i)^(glb|gltf|usdz)$", message = "Format must be one of: glb, gltf, usdz")
        String format,

        Long fileSize,

        @NotNull(message = "Width in cm is required")
        @DecimalMin(value = "0.1", inclusive = true, message = "Width must be greater than zero")
        BigDecimal widthCm,

        @NotNull(message = "Height in cm is required")
        @DecimalMin(value = "0.1", inclusive = true, message = "Height must be greater than zero")
        BigDecimal heightCm,

        @NotNull(message = "Depth in cm is required")
        @DecimalMin(value = "0.1", inclusive = true, message = "Depth must be greater than zero")
        BigDecimal depthCm,

        Integer version,

        String status
) {}
