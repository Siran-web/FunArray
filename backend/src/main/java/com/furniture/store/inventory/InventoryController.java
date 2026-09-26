package com.furniture.store.inventory;

import com.furniture.store.inventory.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/inventory", "/api/inventory"})
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    /**
     * Get paginated inventory records with optional search and low-stock filter.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<Map<String, Object>> getInventory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "false") boolean lowStockOnly,
            @RequestParam(required = false) Integer threshold
    ) {
        return ResponseEntity.ok(inventoryService.getInventory(page, size, query, lowStockOnly, threshold));
    }

    /**
     * Get low stock alerts.
     */
    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<List<InventoryDto>> getLowStockAlerts(
            @RequestParam(required = false) Integer threshold
    ) {
        return ResponseEntity.ok(inventoryService.getLowStockAlerts(threshold));
    }

    /**
     * Get inventory by variant ID.
     */
    @GetMapping("/variant/{variantId}")
    public ResponseEntity<InventoryDto> getInventoryByVariantId(@PathVariable String variantId) {
        return ResponseEntity.ok(inventoryService.getInventoryByVariantId(variantId));
    }

    /**
     * Get inventory for all variants of a product.
     */
    @GetMapping("/product/{productId}")
    public ResponseEntity<List<InventoryDto>> getInventoryByProductId(@PathVariable String productId) {
        return ResponseEntity.ok(inventoryService.getInventoryByProductId(productId));
    }

    /**
     * Check availability for a specific variant or bulk items.
     */
    @PostMapping("/check")
    public ResponseEntity<List<InventoryCheckResult>> checkAvailability(
            @Valid @RequestBody List<StockItemRequest> items
    ) {
        return ResponseEntity.ok(inventoryService.checkBulkAvailability(items));
    }

    /**
     * Check availability for a single variant.
     */
    @GetMapping("/check/{variantId}")
    public ResponseEntity<InventoryCheckResult> checkSingleAvailability(
            @PathVariable String variantId,
            @RequestParam(defaultValue = "1") int quantity
    ) {
        return ResponseEntity.ok(inventoryService.checkAvailability(variantId, quantity));
    }

    /**
     * Set absolute stock quantity for a variant.
     */
    @PutMapping("/variant/{variantId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<InventoryDto> updateStock(
            @PathVariable String variantId,
            @Valid @RequestBody UpdateStockRequest request
    ) {
        return ResponseEntity.ok(inventoryService.updateStock(variantId, request));
    }

    /**
     * Adjust stock relatively (+ or -).
     */
    @PostMapping("/variant/{variantId}/adjust")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public ResponseEntity<InventoryDto> adjustStock(
            @PathVariable String variantId,
            @Valid @RequestBody AdjustStockRequest request
    ) {
        return ResponseEntity.ok(inventoryService.adjustStock(variantId, request));
    }

    /**
     * Atomically reserve stock for checkout.
     */
    @PostMapping("/reserve")
    public ResponseEntity<ReservationResponseDto> reserveStock(
            @Valid @RequestBody ReserveStockRequest request
    ) {
        return ResponseEntity.ok(inventoryService.reserveInventory(request.items()));
    }

    /**
     * Release reserved stock back to available stock.
     */
    @PostMapping("/release")
    public ResponseEntity<Map<String, String>> releaseStock(
            @Valid @RequestBody ReserveStockRequest request
    ) {
        inventoryService.releaseReservation(request.items());
        return ResponseEntity.ok(Map.of("message", "Stock reservation released successfully"));
    }

    /**
     * Commit reserved stock on order completion.
     */
    @PostMapping("/commit")
    public ResponseEntity<Map<String, String>> commitStock(
            @Valid @RequestBody ReserveStockRequest request
    ) {
        inventoryService.commitReservation(request.items());
        return ResponseEntity.ok(Map.of("message", "Stock reservation committed successfully"));
    }
}
