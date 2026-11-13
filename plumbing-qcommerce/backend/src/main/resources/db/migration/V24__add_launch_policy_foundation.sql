CREATE TABLE launch_policies (
    id BIGSERIAL PRIMARY KEY,
    policy_key VARCHAR(80) NOT NULL UNIQUE,
    owned_store_id BIGINT REFERENCES stores(id),
    service_area_center_latitude DOUBLE PRECISION,
    service_area_center_longitude DOUBLE PRECISION,
    service_area_radius_km DECIMAL(10,3),
    visit_fee DECIMAL(19,2),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    payout_policy_version VARCHAR(80),
    cancellation_policy_version VARCHAR(80),
    refund_policy_version VARCHAR(80),
    service_material_enforcement_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    roster_enforcement_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT ck_launch_policy_radius_nonnegative CHECK (service_area_radius_km IS NULL OR service_area_radius_km >= 0),
    CONSTRAINT ck_launch_policy_area_complete CHECK (
        (service_area_center_latitude IS NULL AND service_area_center_longitude IS NULL AND service_area_radius_km IS NULL)
        OR (service_area_center_latitude IS NOT NULL AND service_area_center_longitude IS NOT NULL AND service_area_radius_km IS NOT NULL)
    ),
    CONSTRAINT ck_launch_policy_visit_fee_nonnegative CHECK (visit_fee IS NULL OR visit_fee >= 0),
    CONSTRAINT ck_launch_policy_store_when_enforced CHECK (NOT service_material_enforcement_enabled OR owned_store_id IS NOT NULL),
    CONSTRAINT ck_launch_policy_currency_format CHECK (currency = upper(currency) AND currency ~ '^[A-Z]{3}$')
);

CREATE INDEX idx_launch_policies_active ON launch_policies (policy_key, active);

CREATE TABLE launch_plumber_roster (
    id BIGSERIAL PRIMARY KEY,
    policy_id BIGINT NOT NULL REFERENCES launch_policies(id) ON DELETE CASCADE,
    plumber_id BIGINT NOT NULL REFERENCES users(id),
    approved BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_launch_roster_policy_plumber UNIQUE (policy_id, plumber_id)
);

CREATE INDEX idx_launch_roster_plumber ON launch_plumber_roster (plumber_id, approved);

CREATE TABLE payment_operations (
    id BIGSERIAL PRIMARY KEY,
    service_order_id BIGINT NOT NULL REFERENCES service_orders(id),
    purpose VARCHAR(40) NOT NULL,
    idempotency_key VARCHAR(160) NOT NULL,
    status VARCHAR(40) NOT NULL,
    amount DECIMAL(19,2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    gateway_transaction_id VARCHAR(160),
    failure_reason VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_payment_operation_order_purpose UNIQUE (service_order_id, purpose),
    CONSTRAINT uq_payment_operation_idempotency_key UNIQUE (idempotency_key),
    CONSTRAINT ck_payment_operation_status CHECK (status IN ('INITIATED', 'CAPTURE_IN_PROGRESS', 'CAPTURED', 'FAILED', 'REQUIRES_RECONCILIATION')),
    CONSTRAINT ck_payment_operation_amount_nonnegative CHECK (amount >= 0),
    CONSTRAINT ck_payment_operation_currency_format CHECK (currency = upper(currency) AND currency ~ '^[A-Z]{3}$')
);

CREATE INDEX idx_payment_operations_status ON payment_operations (status);
