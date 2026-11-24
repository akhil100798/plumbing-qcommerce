CREATE TABLE phase2_enrollments (
    id BIGSERIAL PRIMARY KEY,
    service_order_id BIGINT NOT NULL REFERENCES service_orders(id),
    enabled_snapshot BOOLEAN NOT NULL,
    policy_snapshot VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_phase2_enrollment_order UNIQUE (service_order_id)
);

CREATE TABLE service_diagnoses (
    id BIGSERIAL PRIMARY KEY,
    service_order_id BIGINT NOT NULL REFERENCES service_orders(id),
    version INTEGER NOT NULL,
    state VARCHAR(32) NOT NULL,
    summary VARCHAR(4000) NOT NULL,
    submitted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_service_diagnosis_version UNIQUE (service_order_id, version),
    CONSTRAINT ck_service_diagnosis_state CHECK (state IN ('DRAFT','SUBMITTED','SUPERSEDED','CANCELLED'))
);

CREATE TABLE service_diagnosis_evidence (
    id BIGSERIAL PRIMARY KEY,
    diagnosis_id BIGINT NOT NULL REFERENCES service_diagnoses(id),
    photo_id BIGINT NOT NULL REFERENCES service_order_photos(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_diagnosis_evidence_photo UNIQUE (diagnosis_id, photo_id)
);

CREATE TABLE service_pricing_catalog (
    id BIGSERIAL PRIMARY KEY,
    catalog_key VARCHAR(160) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    version INTEGER NOT NULL,
    status VARCHAR(32) NOT NULL,
    effective_from TIMESTAMP NOT NULL,
    effective_to TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_pricing_catalog_version UNIQUE (catalog_key, currency, version),
    CONSTRAINT ck_pricing_catalog_status CHECK (status IN ('DRAFT','ACTIVE','EXPIRED','RETIRED')),
    CONSTRAINT ck_pricing_catalog_currency CHECK (currency = upper(currency) AND currency = 'INR'),
    CONSTRAINT ck_pricing_catalog_period CHECK (effective_to IS NULL OR effective_to > effective_from)
);
CREATE UNIQUE INDEX uq_pricing_catalog_active ON service_pricing_catalog(catalog_key, currency) WHERE status = 'ACTIVE';
CREATE INDEX idx_pricing_catalog_period ON service_pricing_catalog(catalog_key, currency, effective_from, effective_to);

CREATE TABLE service_pricing_catalog_lines (
    id BIGSERIAL PRIMARY KEY,
    pricing_catalog_id BIGINT NOT NULL REFERENCES service_pricing_catalog(id),
    line_key VARCHAR(160) NOT NULL,
    line_type VARCHAR(32) NOT NULL,
    amount DECIMAL(19,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_pricing_catalog_line UNIQUE (pricing_catalog_id, line_key),
    CONSTRAINT ck_pricing_catalog_line_type CHECK (line_type IN ('LABOR','MATERIAL','VISIT','OTHER')),
    CONSTRAINT ck_pricing_catalog_line_amount CHECK (amount >= 0)
);

CREATE TABLE service_quotes (
    id BIGSERIAL PRIMARY KEY,
    service_order_id BIGINT NOT NULL REFERENCES service_orders(id),
    diagnosis_id BIGINT REFERENCES service_diagnoses(id),
    base_quote_id BIGINT REFERENCES service_quotes(id),
    quote_kind VARCHAR(32) NOT NULL,
    version INTEGER NOT NULL,
    state VARCHAR(32) NOT NULL,
    pricing_catalog_id BIGINT REFERENCES service_pricing_catalog(id),
    amount DECIMAL(19,2) NOT NULL,
    customer_approved_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_service_quote_version UNIQUE (service_order_id, quote_kind, version),
    CONSTRAINT ck_service_quote_kind CHECK (quote_kind IN ('INITIAL','REVISION','MATERIAL_ADDENDUM')),
    CONSTRAINT ck_service_quote_state CHECK (state IN ('DRAFT','PUBLISHED','APPROVED','REJECTED','EXPIRED','SUPERSEDED','CANCELLED')),
    CONSTRAINT ck_service_quote_amount CHECK (amount >= 0)
);
CREATE INDEX idx_service_quotes_order_state ON service_quotes(service_order_id, state, created_at);

CREATE TABLE service_quote_lines (
    id BIGSERIAL PRIMARY KEY,
    quote_id BIGINT NOT NULL REFERENCES service_quotes(id),
    line_type VARCHAR(32) NOT NULL,
    description VARCHAR(1000) NOT NULL,
    amount DECIMAL(19,2) NOT NULL,
    pricing_source VARCHAR(32) NOT NULL,
    pricing_catalog_line_id BIGINT REFERENCES service_pricing_catalog_lines(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_quote_line_type CHECK (line_type IN ('LABOR','MATERIAL','VISIT','OTHER')),
    CONSTRAINT ck_quote_line_source CHECK (pricing_source IN ('CATALOG','STORE')),
    CONSTRAINT ck_quote_line_amount CHECK (amount >= 0)
);

CREATE TABLE phase2_idempotency_keys (
    id BIGSERIAL PRIMARY KEY,
    actor_id BIGINT NOT NULL REFERENCES users(id),
    operation VARCHAR(80) NOT NULL,
    resource_type VARCHAR(80) NOT NULL,
    resource_id BIGINT NOT NULL,
    idempotency_key VARCHAR(160) NOT NULL,
    request_fingerprint VARCHAR(128) NOT NULL,
    status VARCHAR(24) NOT NULL,
    response_payload TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_phase2_idempotency UNIQUE (actor_id, operation, resource_type, resource_id, idempotency_key),
    CONSTRAINT ck_phase2_idempotency_status CHECK (status IN ('IN_PROGRESS','COMPLETED','FAILED'))
);

CREATE TABLE service_quote_events (
    id BIGSERIAL PRIMARY KEY,
    service_order_id BIGINT NOT NULL REFERENCES service_orders(id),
    diagnosis_id BIGINT REFERENCES service_diagnoses(id),
    quote_id BIGINT REFERENCES service_quotes(id),
    aggregate_type VARCHAR(32) NOT NULL,
    aggregate_id BIGINT NOT NULL,
    transition_key VARCHAR(64) NOT NULL,
    event_type VARCHAR(48) NOT NULL,
    from_state VARCHAR(32),
    to_state VARCHAR(32),
    actor_id BIGINT REFERENCES users(id),
    actor_role VARCHAR(48),
    reason VARCHAR(1000),
    idempotency_key_id BIGINT REFERENCES phase2_idempotency_keys(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_quote_event_transition UNIQUE (aggregate_type, aggregate_id, transition_key, event_type)
);
CREATE UNIQUE INDEX uq_quote_event_idempotency ON service_quote_events(idempotency_key_id, event_type) WHERE idempotency_key_id IS NOT NULL;
CREATE INDEX idx_quote_events_order_created ON service_quote_events(service_order_id, created_at);

CREATE TABLE service_quote_material_links (
    id BIGSERIAL PRIMARY KEY,
    service_order_id BIGINT NOT NULL REFERENCES service_orders(id),
    quote_id BIGINT NOT NULL REFERENCES service_quotes(id),
    material_request_id BIGINT NOT NULL REFERENCES product_orders(id),
    material_item_id BIGINT NOT NULL REFERENCES product_order_items(id),
    state VARCHAR(32) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_quote_material_link_state CHECK (state IN ('PENDING','ACTIVE','SUPERSEDED','CANCELLED','REJECTED','EXPIRED'))
);
CREATE UNIQUE INDEX uq_quote_material_link_active ON service_quote_material_links(material_item_id) WHERE state IN ('PENDING','ACTIVE');
CREATE INDEX idx_quote_material_links_order ON service_quote_material_links(service_order_id, material_request_id);

CREATE TABLE phase2_reconciliations (
    id BIGSERIAL PRIMARY KEY,
    service_order_id BIGINT NOT NULL REFERENCES service_orders(id),
    authorization_snapshot_amount DECIMAL(19,2) NOT NULL,
    legacy_repair_amount DECIMAL(19,2) NOT NULL,
    variance_amount DECIMAL(19,2) NOT NULL,
    reason VARCHAR(1000) NOT NULL,
    status VARCHAR(32) NOT NULL,
    correction_type VARCHAR(32),
    correction_quote_id BIGINT REFERENCES service_quotes(id),
    correction_addendum_id BIGINT REFERENCES service_quotes(id),
    created_by BIGINT NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolution VARCHAR(1000),
    CONSTRAINT ck_reconciliation_status CHECK (status IN ('OPEN','AWAITING_CUSTOMER_APPROVAL','RESOLVED','CLOSED_CANCELLED')),
    CONSTRAINT ck_reconciliation_type CHECK (correction_type IN ('REVISION','MATERIAL_ADDENDUM','CANCEL')),
    CONSTRAINT ck_reconciliation_positive CHECK (variance_amount > 0),
    CONSTRAINT ck_reconciliation_correction_ref CHECK (
        (correction_type = 'REVISION' AND correction_quote_id IS NOT NULL AND correction_addendum_id IS NULL)
        OR (correction_type = 'MATERIAL_ADDENDUM' AND correction_quote_id IS NULL AND correction_addendum_id IS NOT NULL)
        OR (correction_type = 'CANCEL' AND correction_quote_id IS NULL AND correction_addendum_id IS NULL)
        OR correction_type IS NULL
    )
);
CREATE UNIQUE INDEX uq_open_phase2_reconciliation ON phase2_reconciliations(service_order_id, authorization_snapshot_amount, legacy_repair_amount) WHERE status = 'OPEN';

ALTER TABLE service_order_photos DROP CONSTRAINT IF EXISTS service_order_photos_phase_check;
ALTER TABLE service_order_photos ADD CONSTRAINT service_order_photos_phase_check CHECK (phase IN ('BEFORE','DIAGNOSIS','AFTER'));
