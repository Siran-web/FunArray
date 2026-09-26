package com.furniture.store.order.repository;

import com.furniture.store.order.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, String> {
    List<Order> findByUserIdOrderByCreatedAtDesc(String userId);
    Page<Order> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);
    Optional<Order> findByIdAndUserId(String id, String userId);
    Optional<Order> findByOrderNumber(String orderNumber);
}
