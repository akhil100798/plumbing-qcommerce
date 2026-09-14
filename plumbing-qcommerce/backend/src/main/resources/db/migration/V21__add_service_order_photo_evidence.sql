CREATE TABLE IF NOT EXISTS service_order_photos (
    id BIGSERIAL PRIMARY KEY,
    service_order_id BIGINT NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    phase VARCHAR(16) NOT NULL CHECK (phase IN ('BEFORE', 'AFTER')),
    storage_key VARCHAR(255) NOT NULL UNIQUE,
    content_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 5242880),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_service_order_photos_order_phase ON service_order_photos(service_order_id, phase, created_at);
