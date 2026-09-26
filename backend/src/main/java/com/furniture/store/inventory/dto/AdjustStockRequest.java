package com.furniture.store.inventory.dto;

import jakarta.validation.constraints.NotNull;

public record AdjustStockRequest(
        @NotNull(message = "Adjustment amount is required (can be positive or negative)")
        Integer adjustment,

        String reason
) {}
