package com.furniture.store.visualization.service;

import com.furniture.store.exception.ForbiddenException;
import com.furniture.store.exception.ResourceNotFoundException;
import com.furniture.store.user.entity.User;
import com.furniture.store.user.repository.UserRepository;
import com.furniture.store.visualization.document.RoomImage;
import com.furniture.store.visualization.document.VisualizationSession;
import com.furniture.store.visualization.dto.*;
import com.furniture.store.visualization.repository.RoomImageRepository;
import com.furniture.store.visualization.repository.VisualizationSessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class VisualizationService {

    private final RoomImageRepository roomImageRepository;
    private final VisualizationSessionRepository sessionRepository;
    private final UserRepository userRepository;

    public VisualizationService(
            RoomImageRepository roomImageRepository,
            VisualizationSessionRepository sessionRepository,
            UserRepository userRepository
    ) {
        this.roomImageRepository = roomImageRepository;
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
    }

    // ==================== Room Images ====================

    public RoomImageDto createRoomImage(String userId, CreateRoomImageRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        RoomImage roomImage = new RoomImage(
                UUID.randomUUID().toString(),
                user,
                request.name() != null && !request.name().isBlank() ? request.name() : "My Room",
                request.imageUrl(),
                request.fileKey(),
                request.fileSize(),
                request.mimeType(),
                request.width(),
                request.height()
        );

        RoomImage saved = roomImageRepository.save(roomImage);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<RoomImageDto> getUserRoomImages(String userId) {
        return roomImageRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public RoomImageDto getRoomImage(String id, String userId) {
        RoomImage image = roomImageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room image not found: " + id));

        if (!image.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Access denied. You do not have permission to view this room image.");
        }

        return toDto(image);
    }

    public void deleteRoomImage(String id, String userId) {
        RoomImage image = roomImageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Room image not found: " + id));

        if (!image.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Access denied. You do not have permission to delete this room image.");
        }

        roomImageRepository.delete(image);
    }

    // ==================== Visualization Sessions ====================

    public VisualizationSessionDto saveSession(String userId, SaveSessionRequest request) {
        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        RoomImage roomImage = request.roomImageId() != null
                ? roomImageRepository.findById(request.roomImageId()).orElse(null)
                : null;

        VisualizationSession session = new VisualizationSession(
                UUID.randomUUID().toString(),
                user,
                roomImage,
                request.roomImageUrl(),
                request.name() != null ? request.name() : "My Furniture Scene",
                request.sceneData()
        );

        VisualizationSession saved = sessionRepository.save(session);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public List<VisualizationSessionDto> getUserSessions(String userId) {
        return sessionRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public VisualizationSessionDto getSession(String id, String userId) {
        VisualizationSession session = sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Visualization session not found: " + id));

        if (session.getUser() != null && !session.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Access denied to this visualization session.");
        }

        return toDto(session);
    }

    public void deleteSession(String id, String userId) {
        VisualizationSession session = sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Visualization session not found: " + id));

        if (session.getUser() != null && !session.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Access denied to delete this visualization session.");
        }

        sessionRepository.delete(session);
    }

    public VisualizationSessionDto updateSession(String id, String userId, SaveSessionRequest request) {
        VisualizationSession session = sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Visualization session not found: " + id));

        if (session.getUser() != null && !session.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Access denied to update this visualization session.");
        }

        if (request.name() != null) session.setName(request.name());
        if (request.roomImageUrl() != null) session.setRoomImageUrl(request.roomImageUrl());
        if (request.sceneData() != null) session.setSceneData(request.sceneData());
        if (request.roomImageId() != null) {
            RoomImage roomImage = roomImageRepository.findById(request.roomImageId()).orElse(null);
            session.setRoomImage(roomImage);
        }

        session.setUpdatedAt(java.time.Instant.now());
        VisualizationSession saved = sessionRepository.save(session);
        return toDto(saved);
    }

    // ==================== Helpers ====================

    private RoomImageDto toDto(RoomImage image) {
        return new RoomImageDto(
                image.getId(),
                image.getUser().getId(),
                image.getName(),
                image.getImageUrl(),
                image.getFileKey(),
                image.getFileSize(),
                image.getMimeType(),
                image.getWidth(),
                image.getHeight(),
                image.getCreatedAt()
        );
    }

    private VisualizationSessionDto toDto(VisualizationSession session) {
        return new VisualizationSessionDto(
                session.getId(),
                session.getUser() != null ? session.getUser().getId() : null,
                session.getRoomImage() != null ? session.getRoomImage().getId() : null,
                session.getRoomImageUrl(),
                session.getName(),
                session.getSceneData(),
                session.getCreatedAt(),
                session.getUpdatedAt()
        );
    }
}
