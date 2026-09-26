package com.furniture.store.inventory;

import com.furniture.store.exception.BadRequestException;
import com.furniture.store.exception.InsufficientInventoryException;
import com.furniture.store.exception.ResourceNotFoundException;
import com.furniture.store.inventory.dto.*;
import com.furniture.store.inventory.entity.Inventory;
import com.furniture.store.inventory.repository.InventoryRepository;
import com.furniture.store.product.entity.ProductVariant;
import com.furniture.store.product.repository.ProductVariantRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@Transactional
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final ProductVariantRepository productVariantRepository;

    public static final int DEFAULT_LOW_STOCK_THRESHOLD = 5;

    public InventoryService(
            InventoryRepository inventoryRepository,
            ProductVariantRepository productVariantRepository
    ) {
        this.inventoryRepository = inventoryRepository;
        this.productVariantRepository = productVariantRepository;
    }

    // ==================== Inventory Queries ====================

    @Transactional(readOnly = true)
    public Map<String, Object> getInventory(
            int page,
            int size,
            String query,
            boolean lowStockOnly,
            Integer threshold
    ) {
        int th = threshold != null ? threshold : DEFAULT_LOW_STOCK_THRESHOLD;
        PageRequest pageRequest = PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by("available").ascending());

        Page<Inventory> inventoryPage = inventoryRepository.findFiltered(query, lowStockOnly, th, pageRequest);

        List<InventoryDto> content = inventoryPage.getContent().stream()
                .map(this::toDto)
                .toList();

        Map<String, Object> response = new HashMap<>();
        response.put("content", content);
        response.put("page", inventoryPage.getNumber());
        response.put("size", inventoryPage.getSize());
        response.put("totalElements", inventoryPage.getTotalElements());
        response.put("totalPages", inventoryPage.getTotalPages());

        return response;
    }

    @Transactional(readOnly = true)
    public List<InventoryDto> getLowStockAlerts(Integer threshold) {
        int th = threshold != null ? threshold : DEFAULT_LOW_STOCK_THRESHOLD;
        return inventoryRepository.findLowStockItems(th).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public InventoryDto getInventoryByVariantId(String variantId) {
        Inventory inv = inventoryRepository.findByVariantId(variantId)
                .orElseGet(() -> {
                    ProductVariant variant = productVariantRepository.findById(variantId)
                            .orElseThrow(() -> new ResourceNotFoundException("Product variant not found: " + variantId));
                    return getOrCreateInventory(variant);
                });
        return toDto(inv);
    }

    @Transactional(readOnly = true)
    public List<InventoryDto> getInventoryByProductId(String productId) {
        List<Inventory> inventories = inventoryRepository.findByProductId(productId);
        if (inventories.isEmpty()) {
            List<ProductVariant> variants = productVariantRepository.findByProductId(productId);
            return variants.stream()
                    .map(this::getOrCreateInventory)
                    .map(this::toDto)
                    .toList();
        }
        return inventories.stream()
                .map(this::toDto)
                .toList();
    }

    // ==================== Stock Mutations (Admin / Staff) ====================

    public InventoryDto updateStock(String variantId, UpdateStockRequest request) {
        ProductVariant variant = productVariantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Product variant not found: " + variantId));

        Inventory inventory = inventoryRepository.findByVariantId(variantId)
                .orElseGet(() -> getOrCreateInventory(variant));

        inventory.setQuantity(request.quantity());
        Inventory saved = inventoryRepository.save(inventory);

        // Sync variant stock quantity
        variant.setStockQuantity(saved.getQuantity());
        productVariantRepository.save(variant);

        return toDto(saved);
    }

    public InventoryDto adjustStock(String variantId, AdjustStockRequest request) {
        ProductVariant variant = productVariantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Product variant not found: " + variantId));

        Inventory inventory = inventoryRepository.findByVariantId(variantId)
                .orElseGet(() -> getOrCreateInventory(variant));

        inventory.adjustStock(request.adjustment());
        Inventory saved = inventoryRepository.save(inventory);

        // Sync variant stock quantity
        variant.setStockQuantity(saved.getQuantity());
        productVariantRepository.save(variant);

        return toDto(saved);
    }

    // ==================== Availability & Reservation Enforcement (TICKET-017) ====================

    @Transactional(readOnly = true)
    public InventoryCheckResult checkAvailability(String variantId, int requestedQuantity) {
        ProductVariant variant = productVariantRepository.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Product variant not found: " + variantId));

        Inventory inventory = inventoryRepository.findByVariantId(variantId)
                .orElseGet(() -> getOrCreateInventory(variant));

        boolean inStock = inventory.getAvailable() >= requestedQuantity;
        return new InventoryCheckResult(
                variant.getId(),
                variant.getSku(),
                requestedQuantity,
                inventory.getAvailable(),
                inStock
        );
    }

    @Transactional(readOnly = true)
    public List<InventoryCheckResult> checkBulkAvailability(List<StockItemRequest> items) {
        if (items == null || items.isEmpty()) {
            return Collections.emptyList();
        }

        List<InventoryCheckResult> results = new ArrayList<>();
        for (StockItemRequest item : items) {
            results.add(checkAvailability(item.variantId(), item.quantity()));
        }
        return results;
    }

    /**
     * Atomically reserves stock using pessimistic locking across all requested items.
     * If any item is insufficient, the transaction fails and rolls back completely.
     */
    public ReservationResponseDto reserveInventory(List<StockItemRequest> items) {
        if (items == null || items.isEmpty()) {
            throw new BadRequestException("No items provided for stock reservation");
        }

        // Sort items by variantId to prevent database deadlocks on concurrent reservations
        List<StockItemRequest> sortedItems = items.stream()
                .sorted(Comparator.comparing(StockItemRequest::variantId))
                .toList();

        List<StockItemRequest> reservedItems = new ArrayList<>();

        for (StockItemRequest item : sortedItems) {
            ProductVariant variant = productVariantRepository.findById(item.variantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product variant not found: " + item.variantId()));

            Inventory inventory = inventoryRepository.findByVariantIdWithLock(item.variantId())
                    .orElseGet(() -> getOrCreateInventory(variant));

            if (inventory.getAvailable() < item.quantity()) {
                throw new InsufficientInventoryException(
                        variant.getSku(),
                        inventory.getAvailable(),
                        item.quantity()
                );
            }

            inventory.reserve(item.quantity());
            inventoryRepository.save(inventory);
            reservedItems.add(item);
        }

        String reservationId = UUID.randomUUID().toString();
        Instant reservedUntil = Instant.now().plus(15, ChronoUnit.MINUTES);

        return new ReservationResponseDto(
                reservationId,
                true,
                reservedItems,
                reservedUntil,
                Instant.now()
        );
    }

    /**
     * Releases reserved stock back into available quantity (e.g. if customer abandons or cancels checkout).
     */
    public void releaseReservation(List<StockItemRequest> items) {
        if (items == null || items.isEmpty()) return;

        List<StockItemRequest> sortedItems = items.stream()
                .sorted(Comparator.comparing(StockItemRequest::variantId))
                .toList();

        for (StockItemRequest item : sortedItems) {
            inventoryRepository.findByVariantIdWithLock(item.variantId())
                    .ifPresent(inventory -> {
                        inventory.releaseReservation(item.quantity());
                        inventoryRepository.save(inventory);
                    });
        }
    }

    /**
     * Commits the reservation into finalized stock deduction upon successful order payment.
     */
    public void commitReservation(List<StockItemRequest> items) {
        if (items == null || items.isEmpty()) return;

        List<StockItemRequest> sortedItems = items.stream()
                .sorted(Comparator.comparing(StockItemRequest::variantId))
                .toList();

        for (StockItemRequest item : sortedItems) {
            ProductVariant variant = productVariantRepository.findById(item.variantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product variant not found: " + item.variantId()));

            Inventory inventory = inventoryRepository.findByVariantIdWithLock(item.variantId())
                    .orElseGet(() -> getOrCreateInventory(variant));

            inventory.commitReservation(item.quantity());
            Inventory saved = inventoryRepository.save(inventory);

            variant.setStockQuantity(saved.getQuantity());
            productVariantRepository.save(variant);
        }
    }

    // ==================== Helper Methods ====================

    public Inventory getOrCreateInventory(ProductVariant variant) {
        return inventoryRepository.findByVariantId(variant.getId())
                .orElseGet(() -> {
                    int initialQty = variant.getStockQuantity() != null ? variant.getStockQuantity() : 0;
                    Inventory inv = new Inventory(
                            UUID.randomUUID().toString(),
                            variant.getProduct(),
                            variant,
                            initialQty
                    );
                    return inventoryRepository.save(inv);
                });
    }

    private InventoryDto toDto(Inventory inv) {
        String productId = inv.getProduct() != null ? inv.getProduct().getId() : "";
        String productName = inv.getProduct() != null ? inv.getProduct().getName() : "";
        String variantId = inv.getVariant() != null ? inv.getVariant().getId() : "";
        String variantSku = inv.getVariant() != null ? inv.getVariant().getSku() : "";
        String variantColor = inv.getVariant() != null ? inv.getVariant().getColor() : "";
        String variantMaterial = inv.getVariant() != null ? inv.getVariant().getMaterial() : "";

        return new InventoryDto(
                inv.getId(),
                productId,
                productName,
                variantId,
                variantSku,
                variantColor,
                variantMaterial,
                inv.getQuantity(),
                inv.getReserved(),
                inv.getAvailable(),
                inv.getUpdatedAt()
        );
    }
}
