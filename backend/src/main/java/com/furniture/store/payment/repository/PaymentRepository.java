package com.furniture.store.payment.repository;

import com.furniture.store.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, String> {
    Optional<Payment> findByTransactionId(String transactionId);
    List<Payment> findByOrderIdOrderByCreatedAtDesc(String orderId);
    Optional<Payment> findFirstByOrderIdOrderByCreatedAtDesc(String orderId);
}
