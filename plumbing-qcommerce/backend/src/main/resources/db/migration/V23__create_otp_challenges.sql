CREATE TABLE IF NOT EXISTS otp_challenges (
    id BIGSERIAL PRIMARY KEY,
    phone_key VARCHAR(128) NOT NULL UNIQUE,
    otp_hash VARCHAR(128),
    otp_expires_at TIMESTAMP WITH TIME ZONE,
    attempts INTEGER NOT NULL DEFAULT 0,
    cooldown_until TIMESTAMP WITH TIME ZONE,
    locked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_otp_challenges_expiry ON otp_challenges (otp_expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_challenges_lock ON otp_challenges (locked_until);
