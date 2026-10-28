ALTER TABLE service_diagnoses ADD COLUMN IF NOT EXISTS plumber_id BIGINT REFERENCES users(id);
ALTER TABLE service_diagnoses ADD COLUMN IF NOT EXISTS affected_component VARCHAR(500);
ALTER TABLE service_diagnoses ADD COLUMN IF NOT EXISTS observed_condition VARCHAR(4000);
ALTER TABLE service_diagnoses ADD COLUMN IF NOT EXISTS diagnosis_narrative VARCHAR(8000);
ALTER TABLE service_diagnoses ADD COLUMN IF NOT EXISTS recommended_remedy VARCHAR(4000);
ALTER TABLE service_diagnoses ADD COLUMN IF NOT EXISTS estimated_labor_units DECIMAL(12,2);
ALTER TABLE service_diagnoses ADD COLUMN IF NOT EXISTS known_material_candidates VARCHAR(4000);
ALTER TABLE service_diagnoses ADD COLUMN IF NOT EXISTS safety_notes VARCHAR(4000);
ALTER TABLE service_diagnoses ADD COLUMN IF NOT EXISTS safety_blocked BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE service_diagnoses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE service_diagnoses ADD COLUMN IF NOT EXISTS version_number INTEGER;
UPDATE service_diagnoses SET version_number = version WHERE version_number IS NULL;
ALTER TABLE service_diagnoses ALTER COLUMN version_number SET DEFAULT 1;
ALTER TABLE service_diagnoses ADD COLUMN IF NOT EXISTS optimistic_version BIGINT NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_service_diagnoses_order_state ON service_diagnoses(service_order_id, state, version DESC);

ALTER TABLE service_quotes ADD COLUMN IF NOT EXISTS currency VARCHAR(3);
ALTER TABLE service_quotes ADD COLUMN IF NOT EXISTS labor_subtotal DECIMAL(19,2);
ALTER TABLE service_quotes ADD COLUMN IF NOT EXISTS known_material_subtotal DECIMAL(19,2);
ALTER TABLE service_quotes ADD COLUMN IF NOT EXISTS total DECIMAL(19,2);
ALTER TABLE service_quotes ADD COLUMN IF NOT EXISTS pricing_catalog_version VARCHAR(160);
ALTER TABLE service_quotes ADD COLUMN IF NOT EXISTS published_at TIMESTAMP;
ALTER TABLE service_quotes ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE service_quotes ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP;
ALTER TABLE service_quotes ADD COLUMN IF NOT EXISTS decision_actor_id BIGINT REFERENCES users(id);
ALTER TABLE service_quotes ADD COLUMN IF NOT EXISTS optimistic_version BIGINT NOT NULL DEFAULT 0;

ALTER TABLE service_diagnosis_evidence ADD COLUMN IF NOT EXISTS evidence_role VARCHAR(32) NOT NULL DEFAULT 'DIAGNOSIS';
CREATE INDEX IF NOT EXISTS idx_diagnosis_evidence_diagnosis ON service_diagnosis_evidence(diagnosis_id, created_at);
