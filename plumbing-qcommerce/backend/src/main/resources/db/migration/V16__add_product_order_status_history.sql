-- V16: product_order_status_history table for real transition audit trail

CREATE TABLE IF NOT EXISTS product_order_status_history (
    id                BIGSERIAL PRIMARY KEY,
    product_order_id  BIGINT       NOT NULL REFERENCES product_orders(id) ON DELETE CASCADE,
    previous_status   VARCHAR(50),
    new_status        VARCHAR(50)  NOT NULL,
    actor_id          BIGINT       REFERENCES users(id),
    actor_role        VARCHAR(50),
    reason            VARCHAR(1000),
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posh_product_order ON product_order_status_history(product_order_id);
CREATE INDEX IF NOT EXISTS idx_posh_actor         ON product_order_status_history(actor_id);
