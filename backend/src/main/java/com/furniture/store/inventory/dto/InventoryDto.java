package com.furniture.store.inventory.dto;

import java.time.Instant;

public record InventoryDto(
        String id,
        String productId,
        String productName,
        String variantId,
        String variantSku,
        String variantColor,
        String variantMaterial,
        int quantity,
        int reserved,
        int available,
        Instant updatedAt
) {}
