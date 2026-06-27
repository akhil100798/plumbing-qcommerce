CREATE INDEX IF NOT EXISTS idx_plumber_kyc_reviewed_by_admin
    ON plumber_kyc(reviewed_by_admin_id);

CREATE INDEX IF NOT EXISTS idx_offers_active
    ON offers(active);

CREATE INDEX IF NOT EXISTS idx_offers_schedule_window
    ON offers(starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status
    ON marketing_campaigns(status);

CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_target_segment
    ON marketing_campaigns(target_segment);

CREATE INDEX IF NOT EXISTS idx_marketing_banners_active
    ON marketing_banners(active);

CREATE INDEX IF NOT EXISTS idx_marketing_banners_placement
    ON marketing_banners(placement);

CREATE INDEX IF NOT EXISTS idx_marketing_notifications_status
    ON marketing_notifications(status);

CREATE INDEX IF NOT EXISTS idx_marketing_notifications_sent_by
    ON marketing_notifications(sent_by_admin_id);

CREATE INDEX IF NOT EXISTS idx_marketing_notifications_target_segment
    ON marketing_notifications(target_segment);
