package com.furniture.store.inventory.repository;

import com.furniture.store.inventory.entity.Inventory;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, String> {

    Optional<Inventory> findByVariantId(String variantId);

    List<Inventory> findByProductId(String productId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Inventory i WHERE i.variant.id = :variantId")
    Optional<Inventory> findByVariantIdWithLock(@Param("variantId") String variantId);

    @Query("SELECT i FROM Inventory i WHERE i.variant.id IN :variantIds")
    List<Inventory> findByVariantIdIn(@Param("variantIds") Collection<String> variantIds);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Inventory i WHERE i.variant.id IN :variantIds")
    List<Inventory> findByVariantIdInWithLock(@Param("variantIds") Collection<String> variantIds);

    @Query("""
        SELECT i FROM Inventory i
        WHERE (:query IS NULL OR (
            LOWER(i.product.name) LIKE LOWER(CONCAT('%', :query, '%')) OR
            LOWER(i.variant.sku) LIKE LOWER(CONCAT('%', :query, '%')) OR
            LOWER(i.variant.color) LIKE LOWER(CONCAT('%', :query, '%'))
        ))
        AND (:lowStockOnly = false OR i.available <= :threshold)
    """)
    Page<Inventory> findFiltered(
            @Param("query") String query,
            @Param("lowStockOnly") boolean lowStockOnly,
            @Param("threshold") int threshold,
            Pageable pageable
    );

    @Query("SELECT i FROM Inventory i WHERE i.available <= :threshold ORDER BY i.available ASC")
    List<Inventory> findLowStockItems(@Param("threshold") int threshold);
}
