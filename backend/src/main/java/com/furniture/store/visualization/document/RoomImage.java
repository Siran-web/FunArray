package com.furniture.store.visualization.document;

import com.furniture.store.user.entity.User;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "room_images")
public class RoomImage {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(length = 150)
    private String name;

    @Column(name = "image_url", nullable = false, length = 1000)
    private String imageUrl;

    @Column(name = "file_key", length = 255)
    private String fileKey;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "mime_type", length = 50)
    private String mimeType;

    private Integer width;
    private Integer height;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public RoomImage() {}

    public RoomImage(String id, User user, String name, String imageUrl, String fileKey, Long fileSize, String mimeType, Integer width, Integer height) {
        this.id = id;
        this.user = user;
        this.name = name != null ? name : "Room Photo";
        this.imageUrl = imageUrl;
        this.fileKey = fileKey;
        this.fileSize = fileSize;
        this.mimeType = mimeType;
        this.width = width;
        this.height = height;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getFileKey() { return fileKey; }
    public void setFileKey(String fileKey) { this.fileKey = fileKey; }
    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }
    public Integer getWidth() { return width; }
    public void setWidth(Integer width) { this.width = width; }
    public Integer getHeight() { return height; }
    public void setHeight(Integer height) { this.height = height; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
