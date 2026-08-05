ALTER TABLE product_orders ADD COLUMN IF NOT EXISTS requested_by_plumber_id BIGINT REFERENCES users(id);
ALTER TABLE product_orders ADD COLUMN IF NOT EXISTS collected_by_plumber_id BIGINT REFERENCES users(id);
ALTER TABLE product_orders ADD COLUMN IF NOT EXISTS notes VARCHAR(1000);
ALTER TABLE product_orders ADD COLUMN IF NOT EXISTS store_confirmed_at TIMESTAMP;
ALTER TABLE product_orders ADD COLUMN IF NOT EXISTS plumber_arrived_at TIMESTAMP;
ALTER TABLE product_orders ADD COLUMN IF NOT EXISTS plumber_collected_at TIMESTAMP;
ALTER TABLE product_orders ADD COLUMN IF NOT EXISTS collection_confirmed_at TIMESTAMP;
ALTER TABLE product_order_items ADD COLUMN IF NOT EXISTS reserved_quantity INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_product_orders_service_order ON product_orders(service_order_id);
CREATE INDEX IF NOT EXISTS idx_product_orders_store_status ON product_orders(store_id, status);
CREATE INDEX IF NOT EXISTS idx_product_orders_requested_plumber ON product_orders(requested_by_plumber_id);

ALTER TABLE product_order_items DROP CONSTRAINT IF EXISTS chk_product_order_item_quantity;
ALTER TABLE product_order_items ADD CONSTRAINT chk_product_order_item_quantity CHECK (quantity > 0);
ALTER TABLE product_order_items DROP CONSTRAINT IF EXISTS chk_product_order_item_reserved_quantity;
ALTER TABLE product_order_items ADD CONSTRAINT chk_product_order_item_reserved_quantity CHECK (reserved_quantity >= 0 AND reserved_quantity <= quantity);

ALTER TABLE stocks DROP CONSTRAINT IF EXISTS chk_stock_quantities_non_negative;
ALTER TABLE stocks ADD CONSTRAINT chk_stock_quantities_non_negative CHECK (available_quantity >= 0 AND reserved_quantity >= 0);

ALTER TABLE product_orders DROP CONSTRAINT IF EXISTS product_orders_status_check;
ALTER TABLE product_orders ADD CONSTRAINT product_orders_status_check CHECK (status IN (
    'PENDING', 'REQUESTED', 'STORE_REVIEWING', 'APPROVED', 'PARTIALLY_AVAILABLE',
    'REJECTED', 'RESERVED', 'CONFIRMED', 'PREPARING', 'PACKING', 'READY_FOR_PICKUP',
    'PLUMBER_AT_STORE', 'COLLECTED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED', 'CANCELLED'
));
