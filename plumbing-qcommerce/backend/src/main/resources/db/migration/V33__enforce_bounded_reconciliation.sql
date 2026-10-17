-- A reconciliation is a single attempt snapshot and only one live attempt may
-- exist for an order, regardless of whether it is awaiting customer approval.
DROP INDEX IF EXISTS uq_open_phase2_reconciliation;
CREATE UNIQUE INDEX uq_live_phase2_reconciliation
    ON phase2_reconciliations(service_order_id)
    WHERE status IN ('OPEN', 'AWAITING_CUSTOMER_APPROVAL');

-- Closed and resolved records always have an explicit terminal timestamp.
ALTER TABLE phase2_reconciliations
    ADD CONSTRAINT ck_reconciliation_terminal_timestamp
    CHECK (status NOT IN ('RESOLVED', 'CLOSED_CANCELLED') OR resolved_at IS NOT NULL);

-- A nullable correction type is valid only when both correction references are
-- absent. Terminal state and correction type must describe the same outcome.
ALTER TABLE phase2_reconciliations
    ADD CONSTRAINT ck_reconciliation_correction_ref_strict
    CHECK (
        (correction_type IS NULL AND correction_quote_id IS NULL AND correction_addendum_id IS NULL)
        OR (correction_type IS NOT NULL AND correction_type = 'REVISION' AND correction_quote_id IS NOT NULL AND correction_addendum_id IS NULL)
        OR (correction_type IS NOT NULL AND correction_type = 'MATERIAL_ADDENDUM' AND correction_quote_id IS NULL AND correction_addendum_id IS NOT NULL)
        OR (correction_type IS NOT NULL AND correction_type = 'CANCEL' AND correction_quote_id IS NULL AND correction_addendum_id IS NULL)
    ),
    DROP CONSTRAINT ck_reconciliation_positive,
    ADD CONSTRAINT ck_reconciliation_variance_status
    CHECK (
        (status IN ('OPEN', 'AWAITING_CUSTOMER_APPROVAL', 'CLOSED_CANCELLED') AND variance_amount > 0)
        OR (status = 'RESOLVED' AND (
            (variance_amount < 0 AND correction_type IS NULL AND correction_quote_id IS NULL AND correction_addendum_id IS NULL)
            OR (variance_amount > 0 AND correction_type IS NOT NULL AND correction_type IN ('REVISION', 'MATERIAL_ADDENDUM'))
        ))
    ),
    ADD CONSTRAINT ck_reconciliation_terminal_type
    CHECK (
        (status = 'OPEN' AND correction_type IS NULL)
        OR (status = 'AWAITING_CUSTOMER_APPROVAL' AND correction_type IS NOT NULL AND correction_type IN ('REVISION', 'MATERIAL_ADDENDUM'))
        OR (status = 'CLOSED_CANCELLED' AND correction_type IS NOT NULL AND correction_type = 'CANCEL')
        OR (status = 'RESOLVED' AND ((correction_type IS NOT NULL AND correction_type IN ('REVISION', 'MATERIAL_ADDENDUM'))
            OR (variance_amount < 0 AND correction_type IS NULL)))
    );
