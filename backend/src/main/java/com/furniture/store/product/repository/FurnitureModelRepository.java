package com.furniture.store.product.repository;

import com.furniture.store.product.entity.FurnitureModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FurnitureModelRepository extends JpaRepository<FurnitureModel, String> {
    Optional<FurnitureModel> findByProductId(String productId);
}
