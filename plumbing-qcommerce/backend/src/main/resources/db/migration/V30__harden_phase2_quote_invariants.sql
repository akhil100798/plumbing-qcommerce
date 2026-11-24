-- V27 introduced this snapshot as text; V29's IF NOT EXISTS did not change it.
-- The catalog version is numeric in the pricing catalog and in the quote entity.
ALTER TABLE service_quotes
    ALTER COLUMN pricing_catalog_version TYPE INTEGER
    USING CASE
        WHEN pricing_catalog_version IS NULL OR btrim(pricing_catalog_version::text) = '' THEN NULL
        ELSE pricing_catalog_version::text::INTEGER
    END;

CREATE UNIQUE INDEX IF NOT EXISTS uq_service_quote_one_revision
    ON service_quotes(service_order_id)
    WHERE quote_kind = 'REVISION';

CREATE UNIQUE INDEX IF NOT EXISTS uq_service_quote_one_approved_repair
    ON service_quotes(service_order_id)
    WHERE state = 'APPROVED' AND quote_kind IN ('INITIAL', 'REVISION');

ALTER TABLE service_quotes
    ADD CONSTRAINT ck_service_quote_published_expiry
    CHECK (published_at IS NULL OR expires_at IS NULL OR expires_at > published_at);

-- Backfill legacy quote-line snapshots before applying the arithmetic guard.
UPDATE service_quote_lines
SET line_total = amount,
    unit_price = round(amount / quantity, 2)
WHERE line_total = 0 AND amount <> 0;

ALTER TABLE service_quote_lines
    ADD CONSTRAINT ck_quote_line_totals
    CHECK (amount = line_total AND line_total = round(quantity * unit_price, 2));
