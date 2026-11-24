-- V20: Add columns for Store App gap closure (packed quantities, low-stock thresholds, store business hours)

ALTER TABLE product_order_items ADD COLUMN IF NOT EXISTS packed_quantity INT NOT NULL DEFAULT 0;

ALTER TABLE stocks ADD COLUMN IF NOT EXISTS low_stock_threshold INT NOT NULL DEFAULT 5;

CREATE TABLE IF NOT EXISTS store_business_hours (
    id BIGSERIAL PRIMARY KEY,
    store_id BIGINT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    day_of_week VARCHAR(15) NOT NULL,
    open_time TIME DEFAULT '08:00:00',
    close_time TIME DEFAULT '20:00:00',
    closed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_store_day UNIQUE (store_id, day_of_week)
);

ALTER TABLE product_orders ADD COLUMN IF NOT EXISTS preparing_started_at TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE product_orders ADD COLUMN IF NOT EXISTS ready_for_pickup_at TIMESTAMP WITHOUT TIME ZONE;
