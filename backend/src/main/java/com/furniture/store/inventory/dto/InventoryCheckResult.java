package com.furniture.store.inventory.dto;

public record InventoryCheckResult(
        String variantId,
        String sku,
        int requestedQuantity,
        int availableQuantity,
        boolean inStock
) {}
