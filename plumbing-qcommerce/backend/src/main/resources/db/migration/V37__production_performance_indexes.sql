-- V37: Production Performance Indexes for High-Frequency Paths
-- Eliminates table scans on service order assignment, customer views, and stock inventory lookups

CREATE INDEX IF NOT EXISTS idx_service_orders_customer_status
    ON service_orders (customer_id, status);

CREATE INDEX IF NOT EXISTS idx_service_orders_plumber_status
    ON service_orders (plumber_id, status);

CREATE INDEX IF NOT EXISTS idx_stocks_store_product
    ON stocks (store_id, product_id);

CREATE INDEX IF NOT EXISTS idx_outbox_events_unprocessed
    ON outbox_events (processed, created_at)
    WHERE processed = false;
