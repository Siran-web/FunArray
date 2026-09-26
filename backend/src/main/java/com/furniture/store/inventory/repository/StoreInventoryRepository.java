package com.furniture.store.inventory.repository;

import com.furniture.store.inventory.entity.StoreInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StoreInventoryRepository extends JpaRepository<StoreInventory, String> {
    List<StoreInventory> findByStoreId(String storeId);
    List<StoreInventory> findByProductId(String productId);
    Optional<StoreInventory> findByStoreIdAndVariantId(String storeId, String variantId);
}
