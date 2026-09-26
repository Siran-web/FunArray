package com.furniture.store.inventory.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record ReserveStockRequest(
        @NotEmpty(message = "Items list cannot be empty")
        List<@Valid StockItemRequest> items
) {}
