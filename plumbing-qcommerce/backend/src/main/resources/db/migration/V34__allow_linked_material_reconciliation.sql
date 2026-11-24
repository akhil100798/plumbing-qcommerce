-- V33's terminal-type rule incorrectly requires every OPEN reconciliation to
-- have no correction reference, and its variance rule cannot represent zero or
-- an over-correction. Keep the rest of the V33 invariant set intact.
ALTER TABLE phase2_reconciliations
    DROP CONSTRAINT ck_reconciliation_terminal_type,
    DROP CONSTRAINT ck_reconciliation_variance_status,
    DROP CONSTRAINT ck_reconciliation_terminal_timestamp;

ALTER TABLE phase2_reconciliations
    ADD CONSTRAINT ck_reconciliation_terminal_type
        CHECK (
            (status = 'OPEN' AND (correction_type IS NULL OR correction_type IN ('REVISION', 'MATERIAL_ADDENDUM')))
            OR (status = 'AWAITING_CUSTOMER_APPROVAL' AND correction_type IS NOT NULL
                AND correction_type IN ('REVISION', 'MATERIAL_ADDENDUM'))
            OR (status = 'CLOSED_CANCELLED' AND correction_type IS NOT NULL AND correction_type = 'CANCEL')
            OR (status = 'RESOLVED' AND (
                (correction_type IS NOT NULL AND correction_type IN ('REVISION', 'MATERIAL_ADDENDUM'))
                OR (correction_type IS NULL AND variance_amount < 0)
            ))
        ),
    ADD CONSTRAINT ck_reconciliation_variance_status
        CHECK (
            (status IN ('OPEN', 'AWAITING_CUSTOMER_APPROVAL', 'CLOSED_CANCELLED') AND variance_amount > 0)
            OR (status = 'RESOLVED' AND variance_amount <= 0)
        ),
    ADD CONSTRAINT ck_reconciliation_terminal_timestamp
        CHECK (
            (status IN ('OPEN', 'AWAITING_CUSTOMER_APPROVAL') AND resolved_at IS NULL)
            OR (status IN ('RESOLVED', 'CLOSED_CANCELLED') AND resolved_at IS NOT NULL)
        );
