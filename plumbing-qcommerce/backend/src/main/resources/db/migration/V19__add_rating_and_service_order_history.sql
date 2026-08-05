-- V19: Add rating/comment/confirmation columns to service_orders and add service_order_status_history table

ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS rating INTEGER;
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS comment VARCHAR(1000);
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS customer_confirmed_at TIMESTAMP;
ALTER TABLE service_orders ADD COLUMN IF NOT EXISTS rated_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS service_order_status_history (
    id                BIGSERIAL PRIMARY KEY,
    service_order_id  BIGINT       NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    previous_status   VARCHAR(50),
    new_status        VARCHAR(50)  NOT NULL,
    actor_id          BIGINT       REFERENCES users(id),
    actor_role        VARCHAR(50),
    reason            VARCHAR(1000),
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sosh_service_order ON service_order_status_history(service_order_id);
CREATE INDEX IF NOT EXISTS idx_sosh_actor         ON service_order_status_history(actor_id);

