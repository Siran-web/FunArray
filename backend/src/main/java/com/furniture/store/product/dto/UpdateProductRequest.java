package com.furniture.store.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record UpdateProductRequest(
        String categoryId,

        @Size(max = 255, message = "Product name must not exceed 255 characters")
        String name,

        @Size(max = 280, message = "Slug must not exceed 280 characters")
        String slug,

        String description,

        @Size(max = 100, message = "Brand must not exceed 100 characters")
        String brand,

        @DecimalMin(value = "0.0", inclusive = true, message = "Base price must be non-negative")
        BigDecimal basePrice,

        String status,

        @Size(max = 100, message = "Material must not exceed 100 characters")
        String material,

        BigDecimal weight,

        @DecimalMin(value = "0.1", inclusive = true, message = "Width must be greater than zero")
        BigDecimal widthCm,

        @DecimalMin(value = "0.1", inclusive = true, message = "Height must be greater than zero")
        BigDecimal heightCm,

        @DecimalMin(value = "0.1", inclusive = true, message = "Depth must be greater than zero")
        BigDecimal depthCm,

        @Size(max = 100, message = "SKU must not exceed 100 characters")
        String sku
) {}
