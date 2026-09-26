package com.furniture.store.user.repository;

import com.furniture.store.user.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AddressRepository extends JpaRepository<Address, String> {
    List<Address> findByUserIdOrderByCreatedAtDesc(String userId);
    Optional<Address> findByIdAndUserId(String id, String userId);
    Optional<Address> findByUserIdAndIsDefaultTrue(String userId);

    @Modifying
    @Query("UPDATE Address a SET a.isDefault = false WHERE a.user.id = :userId")
    void resetDefaultAddressesForUser(@Param("userId") String userId);
}
