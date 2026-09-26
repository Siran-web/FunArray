package com.furniture.store.inventory.repository;

import com.furniture.store.inventory.entity.PhysicalStore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PhysicalStoreRepository extends JpaRepository<PhysicalStore, String> {
    Optional<PhysicalStore> findByCode(String code);
    List<PhysicalStore> findByIsActiveTrue();
}
