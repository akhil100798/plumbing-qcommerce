ALTER TABLE service_orders ADD COLUMN issue_category VARCHAR(80);
ALTER TABLE service_orders ADD COLUMN urgency VARCHAR(32);
ALTER TABLE service_orders ADD COLUMN scheduled_for TIMESTAMP;
ALTER TABLE service_orders ADD COLUMN address_line_1 VARCHAR(255);
ALTER TABLE service_orders ADD COLUMN address_line_2 VARCHAR(255);
ALTER TABLE service_orders ADD COLUMN landmark VARCHAR(255);
ALTER TABLE service_orders ADD COLUMN city VARCHAR(120);
ALTER TABLE service_orders ADD COLUMN postal_code VARCHAR(32);
ALTER TABLE service_orders ADD COLUMN customer_phone_snapshot VARCHAR(32);
ALTER TABLE service_orders ADD COLUMN visit_fee DECIMAL(19,2);
ALTER TABLE service_orders ADD COLUMN currency VARCHAR(3);
ALTER TABLE service_orders ADD COLUMN assigned_at TIMESTAMP;
ALTER TABLE service_orders ADD COLUMN cancelled_at TIMESTAMP;
ALTER TABLE service_orders ADD COLUMN cancelled_by BIGINT REFERENCES users(id);
ALTER TABLE service_orders ADD COLUMN cancellation_reason VARCHAR(1000);

CREATE TABLE service_order_assignments (
    id BIGSERIAL PRIMARY KEY,
    service_order_id BIGINT NOT NULL REFERENCES service_orders(id),
    plumber_id BIGINT NOT NULL REFERENCES users(id),
    status VARCHAR(32) NOT NULL,
    assignment_mode VARCHAR(32) NOT NULL,
    actor_id BIGINT REFERENCES users(id),
    actor_role VARCHAR(50),
    reason VARCHAR(1000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_assignment_status CHECK (status IN ('ASSIGNED','ACCEPTED','REASSIGNED','CANCELLED','ENDED')),
    CONSTRAINT ck_assignment_mode CHECK (assignment_mode IN ('FIRST_ACCEPT','OPERATOR','TARGETED_OFFER'))
);

CREATE INDEX idx_assignment_order_created ON service_order_assignments(service_order_id, created_at);
CREATE INDEX idx_assignment_plumber_status ON service_order_assignments(plumber_id, status, created_at);
CREATE UNIQUE INDEX uq_current_service_order_assignment
    ON service_order_assignments(service_order_id)
    WHERE status IN ('ASSIGNED', 'ACCEPTED');
