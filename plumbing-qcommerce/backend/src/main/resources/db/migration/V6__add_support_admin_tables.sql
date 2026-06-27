CREATE TABLE IF NOT EXISTS support_tickets (
    id BIGSERIAL PRIMARY KEY,
    ticket_number VARCHAR(64) NOT NULL UNIQUE,
    requester_id BIGINT NOT NULL,
    requester_role VARCHAR(40) NOT NULL,
    related_product_order_id BIGINT NULL,
    related_service_order_id BIGINT NULL,
    category VARCHAR(40) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description VARCHAR(2000) NOT NULL,
    assigned_admin_id BIGINT NULL,
    escalation_reason VARCHAR(1000) NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,
    resolved_at TIMESTAMP NULL
);

CREATE TABLE IF NOT EXISTS support_messages (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL,
    sender_id BIGINT NULL,
    sender_role VARCHAR(40) NOT NULL,
    message VARCHAR(2000) NOT NULL,
    internal_note BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NULL
);