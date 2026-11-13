ALTER TABLE service_diagnoses ADD COLUMN IF NOT EXISTS revision_of_diagnosis_id BIGINT REFERENCES service_diagnoses(id);
ALTER TABLE service_diagnoses ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;
-- V26 retains the legacy NOT NULL version column while Phase 2 writes version_number.
-- Keep legacy rows valid without coupling the Phase 2 version contract to that column.
ALTER TABLE service_diagnoses ALTER COLUMN version SET DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_service_diagnoses_revision_of ON service_diagnoses(revision_of_diagnosis_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_service_diagnosis_one_draft ON service_diagnoses(service_order_id) WHERE state = 'DRAFT';
CREATE UNIQUE INDEX IF NOT EXISTS uq_service_diagnosis_one_submitted ON service_diagnoses(service_order_id) WHERE state = 'SUBMITTED';
