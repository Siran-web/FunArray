package com.furniture.store.product.repository;

import com.furniture.store.product.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, String> {
    List<ProductImage> findByProductIdOrderBySortOrderAsc(String productId);
    Optional<ProductImage> findByIdAndProductId(String id, String productId);
    List<ProductImage> findByProductIdAndIsPrimaryTrue(String productId);
}
