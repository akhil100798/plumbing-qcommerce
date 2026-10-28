CREATE TABLE IF NOT EXISTS service_order_plumber_dispositions (
    id BIGSERIAL PRIMARY KEY,
    service_order_id BIGINT NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    plumber_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    disposition VARCHAR(32) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_service_order_plumber_disposition UNIQUE (service_order_id, plumber_id),
    CONSTRAINT service_order_plumber_disposition_check CHECK (disposition IN ('DECLINED'))
);

CREATE INDEX IF NOT EXISTS idx_sopd_plumber_disposition
    ON service_order_plumber_dispositions(plumber_id, disposition);
