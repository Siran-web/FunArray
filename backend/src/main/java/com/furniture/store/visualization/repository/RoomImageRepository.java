package com.furniture.store.visualization.repository;

import com.furniture.store.visualization.document.RoomImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomImageRepository extends JpaRepository<RoomImage, String> {
    List<RoomImage> findByUserIdOrderByCreatedAtDesc(String userId);
    Optional<RoomImage> findByIdAndUserId(String id, String userId);
}
