package com.furniture.store.visualization.document;

import com.furniture.store.user.entity.User;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "visualization_sessions")
public class VisualizationSession {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_image_id")
    private RoomImage roomImage;

    @Column(name = "room_image_url", length = 1000)
    private String roomImageUrl;

    @Column(length = 150)
    private String name;

    @Column(name = "scene_data", columnDefinition = "TEXT")
    private String sceneData;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public VisualizationSession() {}

    public VisualizationSession(String id, User user, RoomImage roomImage, String roomImageUrl, String name, String sceneData) {
        this.id = id;
        this.user = user;
        this.roomImage = roomImage;
        this.roomImageUrl = roomImageUrl;
        this.name = name != null ? name : "Room Layout";
        this.sceneData = sceneData;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public RoomImage getRoomImage() { return roomImage; }
    public void setRoomImage(RoomImage roomImage) { this.roomImage = roomImage; }
    public String getRoomImageUrl() { return roomImageUrl; }
    public void setRoomImageUrl(String roomImageUrl) { this.roomImageUrl = roomImageUrl; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSceneData() { return sceneData; }
    public void setSceneData(String sceneData) { this.sceneData = sceneData; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
