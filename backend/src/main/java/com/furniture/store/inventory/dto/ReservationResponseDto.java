package com.furniture.store.inventory.dto;

import java.time.Instant;
import java.util.List;

public record ReservationResponseDto(
        String reservationId,
        boolean success,
        List<StockItemRequest> reservedItems,
        Instant reservedUntil,
        Instant timestamp
) {}
