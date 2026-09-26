package com.furniture.store.visualization.repository;

import com.furniture.store.visualization.document.VisualizationSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VisualizationSessionRepository extends JpaRepository<VisualizationSession, String> {
    List<VisualizationSession> findByUserIdOrderByUpdatedAtDesc(String userId);
    Optional<VisualizationSession> findByIdAndUserId(String id, String userId);
}
