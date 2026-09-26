CREATE TABLE IF NOT EXISTS otp_challenges (
    id BIGSERIAL PRIMARY KEY,
    phone_key VARCHAR(128) NOT NULL UNIQUE,
    otp_hash VARCHAR(128),
    otp_expires_at TIMESTAMPTZ,
    attempts INTEGER NOT NULL DEFAULT 0,
    cooldown_until TIMESTAMPTZ,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_otp_challenges_expiry ON otp_challenges (otp_expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_challenges_lock ON otp_challenges (locked_until);
