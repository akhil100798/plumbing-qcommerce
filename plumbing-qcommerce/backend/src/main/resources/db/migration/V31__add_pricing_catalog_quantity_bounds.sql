-- A legacy line's unit and upper bound cannot be inferred safely. Preserve
-- such rows, but leave them unpriceable until explicitly configured.
ALTER TABLE service_pricing_catalog_lines
    ADD COLUMN unit VARCHAR(32),
    ADD COLUMN min_quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    ADD COLUMN max_quantity DECIMAL(10,2);

ALTER TABLE service_pricing_catalog_lines
    ADD CONSTRAINT ck_pricing_catalog_line_unit
        CHECK (unit IS NOT NULL AND btrim(unit) <> '') NOT VALID,
    ADD CONSTRAINT ck_pricing_catalog_line_min_quantity
        CHECK (min_quantity > 0),
    ADD CONSTRAINT ck_pricing_catalog_line_quantity_bounds
        CHECK (max_quantity IS NOT NULL AND max_quantity >= min_quantity) NOT VALID;

COMMENT ON COLUMN service_pricing_catalog_lines.unit IS
    'Required for newly configured lines; NULL marks a legacy line requiring explicit catalog administration before pricing.';
COMMENT ON COLUMN service_pricing_catalog_lines.max_quantity IS
    'NULL marks a legacy line without a safely inferable upper bound; configure explicitly before pricing.';
