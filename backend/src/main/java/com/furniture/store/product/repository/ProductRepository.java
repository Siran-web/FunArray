package com.furniture.store.product.repository;

import com.furniture.store.product.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, String> {

    Optional<Product> findBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, String id);

    boolean existsBySku(String sku);

    boolean existsBySkuAndIdNot(String sku, String id);

    @Query("""
        SELECT p FROM Product p
        WHERE (:status IS NULL OR p.status = :status)
        AND (:categoryIds IS NULL OR p.categoryId IN :categoryIds)
        AND (:minPrice IS NULL OR p.basePrice >= :minPrice)
        AND (:maxPrice IS NULL OR p.basePrice <= :maxPrice)
        AND (:query IS NULL OR (
            LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR
            LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%')) OR
            LOWER(p.brand) LIKE LOWER(CONCAT('%', :query, '%')) OR
            LOWER(p.material) LIKE LOWER(CONCAT('%', :query, '%')) OR
            LOWER(p.sku) LIKE LOWER(CONCAT('%', :query, '%'))
        ))
    """)
    Page<Product> findFiltered(
            @Param("categoryIds") Collection<String> categoryIds,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("query") String query,
            @Param("status") String status,
            Pageable pageable
    );
}
