package com.furniture.store.product.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record UpdateProductVariantRequest(
        @Size(max = 100, message = "SKU must not exceed 100 characters")
        String sku,

        @Size(max = 100, message = "Color must not exceed 100 characters")
        String color,

        @Size(max = 100, message = "Material must not exceed 100 characters")
        String material,

        @DecimalMin(value = "0.0", inclusive = true, message = "Price must be non-negative")
        BigDecimal price,

        @Min(value = 0, message = "Stock quantity cannot be negative")
        Integer stockQuantity,

        String status
) {}
