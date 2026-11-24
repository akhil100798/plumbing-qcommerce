CREATE TABLE launch_roster_audit_history (
    id BIGSERIAL PRIMARY KEY,
    policy_id BIGINT NOT NULL REFERENCES launch_policies(id) ON DELETE RESTRICT,
    plumber_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    actor_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action VARCHAR(16) NOT NULL,
    reason VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_launch_roster_audit_action CHECK (action IN ('ACTIVATED', 'DEACTIVATED')),
    CONSTRAINT ck_launch_roster_audit_reason_nonblank CHECK (length(trim(reason)) > 0)
);

CREATE INDEX idx_launch_roster_audit_policy_created
    ON launch_roster_audit_history (policy_id, created_at, id);

CREATE INDEX idx_launch_roster_audit_plumber_created
    ON launch_roster_audit_history (plumber_id, created_at, id);

CREATE FUNCTION prevent_launch_roster_audit_history_mutation() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'launch roster audit history is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_launch_roster_audit_history_immutable
    BEFORE UPDATE OR DELETE ON launch_roster_audit_history
    FOR EACH ROW EXECUTE FUNCTION prevent_launch_roster_audit_history_mutation();

CREATE TRIGGER trg_launch_roster_audit_history_no_truncate
    BEFORE TRUNCATE ON launch_roster_audit_history
    FOR EACH STATEMENT EXECUTE FUNCTION prevent_launch_roster_audit_history_mutation();
