package com.furniture.store.review.repository;

import com.furniture.store.review.entity.Review;
import com.furniture.store.review.entity.ReviewStatus;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, String> {

    List<Review> findByProductIdAndStatus(String productId, ReviewStatus status, Sort sort);

    List<Review> findByProductId(String productId, Sort sort);

    List<Review> findByUserId(String userId, Sort sort);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.product.id = :productId AND r.status = :status")
    Double findAverageRatingByProductIdAndStatus(@Param("productId") String productId, @Param("status") ReviewStatus status);

    long countByProductIdAndStatus(String productId, ReviewStatus status);
}
