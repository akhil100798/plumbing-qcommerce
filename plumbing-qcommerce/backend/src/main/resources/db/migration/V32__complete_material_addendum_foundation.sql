-- Scope addendum versions to their approved repair authorization and make the
-- existing item/request ownership chain enforceable without inventing columns.
ALTER TABLE service_quotes DROP CONSTRAINT IF EXISTS uq_service_quote_version;
CREATE UNIQUE INDEX uq_service_quote_non_addendum_version
    ON service_quotes(service_order_id, quote_kind, version)
    WHERE quote_kind <> 'MATERIAL_ADDENDUM';
CREATE UNIQUE INDEX uq_service_quote_addendum_version
    ON service_quotes(service_order_id, base_quote_id, quote_kind, version)
    WHERE quote_kind = 'MATERIAL_ADDENDUM';
ALTER TABLE service_quotes
    ADD CONSTRAINT ck_service_quote_addendum_base
    CHECK (quote_kind <> 'MATERIAL_ADDENDUM' OR base_quote_id IS NOT NULL);
ALTER TABLE service_quotes
    ADD CONSTRAINT uq_service_quote_id_order UNIQUE (id, service_order_id);
ALTER TABLE service_quotes
    ADD CONSTRAINT fk_service_quote_base_order
        FOREIGN KEY (base_quote_id, service_order_id) REFERENCES service_quotes(id, service_order_id);
CREATE UNIQUE INDEX uq_service_quote_addendum_current
    ON service_quotes(service_order_id, quote_kind)
    WHERE quote_kind = 'MATERIAL_ADDENDUM' AND state = 'PUBLISHED';
ALTER TABLE product_orders
    ADD CONSTRAINT uq_product_order_id_service_order UNIQUE (id, service_order_id);
ALTER TABLE service_quotes ADD COLUMN material_request_id BIGINT;
ALTER TABLE service_quotes
    ADD CONSTRAINT fk_service_quote_addendum_material_request
        FOREIGN KEY (material_request_id, service_order_id) REFERENCES product_orders(id, service_order_id);
ALTER TABLE product_order_items
    ADD CONSTRAINT uq_product_order_item_id_order UNIQUE (id, order_id);
ALTER TABLE product_order_items
    ADD COLUMN unit VARCHAR(32) NOT NULL DEFAULT 'UNIT';
ALTER TABLE product_order_items
    ADD COLUMN unit_price_snapshot DECIMAL(19,2),
    ADD COLUMN pricing_source VARCHAR(32),
    ADD COLUMN pricing_catalog_line_id BIGINT REFERENCES service_pricing_catalog_lines(id),
    ADD COLUMN pricing_catalog_version INTEGER;

ALTER TABLE service_quote_material_links ALTER COLUMN material_item_id DROP NOT NULL;
ALTER TABLE service_quote_material_links ADD COLUMN link_type VARCHAR(32) NOT NULL DEFAULT 'MATERIAL';
ALTER TABLE service_quote_material_links DROP CONSTRAINT IF EXISTS service_quote_material_links_quote_id_fkey;
ALTER TABLE service_quote_material_links DROP CONSTRAINT IF EXISTS service_quote_material_links_material_request_id_fkey;
ALTER TABLE service_quote_material_links DROP CONSTRAINT IF EXISTS service_quote_material_links_material_item_id_fkey;
ALTER TABLE service_quote_material_links
    ADD CONSTRAINT fk_quote_material_link_quote_order
        FOREIGN KEY (quote_id, service_order_id) REFERENCES service_quotes(id, service_order_id),
    ADD CONSTRAINT fk_quote_material_link_request_order
        FOREIGN KEY (material_request_id, service_order_id) REFERENCES product_orders(id, service_order_id),
    ADD CONSTRAINT fk_quote_material_link_item_request
        FOREIGN KEY (material_item_id, material_request_id) REFERENCES product_order_items(id, order_id),
    ADD CONSTRAINT ck_quote_material_link_type CHECK (link_type IN ('REQUEST','MATERIAL'));
ALTER TABLE service_quote_material_links
    ADD CONSTRAINT uq_quote_material_link_quote_item UNIQUE (quote_id, material_item_id);

ALTER TABLE service_quote_lines ADD COLUMN material_item_id BIGINT;
ALTER TABLE service_quote_lines ADD COLUMN material_request_id BIGINT;
ALTER TABLE service_quote_lines
    ADD CONSTRAINT fk_quote_line_material_item_request
        FOREIGN KEY (material_item_id, material_request_id)
        REFERENCES product_order_items(id, order_id);
ALTER TABLE service_quote_material_links
    ADD CONSTRAINT uq_quote_material_link_quote_request_item
        UNIQUE (quote_id, material_request_id, material_item_id),
    ADD CONSTRAINT uq_quote_material_link_item_owner
        UNIQUE (id, quote_id, material_request_id, material_item_id);
ALTER TABLE service_quote_lines
    ADD COLUMN material_link_id BIGINT;
ALTER TABLE service_quote_lines
    ADD CONSTRAINT fk_quote_line_material_link
        FOREIGN KEY (material_link_id, quote_id, material_request_id, material_item_id)
        REFERENCES service_quote_material_links(id, quote_id, material_request_id, material_item_id);
CREATE INDEX idx_service_quote_line_material_item ON service_quote_lines(material_item_id);
