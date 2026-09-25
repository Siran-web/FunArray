CREATE TABLE IF NOT EXISTS furniture_models (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    model_url TEXT NOT NULL,
    thumbnail_url TEXT,
    format VARCHAR(20) NOT NULL DEFAULT 'glb',
    file_size BIGINT,
    width_cm DECIMAL(10, 2) NOT NULL,
    height_cm DECIMAL(10, 2) NOT NULL,
    depth_cm DECIMAL(10, 2) NOT NULL,
    version INT NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_models_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
