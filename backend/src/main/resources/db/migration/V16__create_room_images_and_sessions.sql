CREATE TABLE IF NOT EXISTS room_images (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(150),
    image_url VARCHAR(1000) NOT NULL,
    file_key VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(50),
    width INT,
    height INT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_room_image_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS visualization_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    room_image_id VARCHAR(36),
    room_image_url VARCHAR(1000),
    name VARCHAR(150),
    scene_data TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_viz_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_viz_session_room FOREIGN KEY (room_image_id) REFERENCES room_images(id) ON DELETE SET NULL
);
