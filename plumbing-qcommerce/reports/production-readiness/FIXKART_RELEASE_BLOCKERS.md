# FixKart Release Blockers & Launch Item Classification (`FIXKART_RELEASE_BLOCKERS.md`)

Classification of mandatory pre-launch items vs post-launch enhancements:

---

## 1. MUST FIX BEFORE PUBLIC PRODUCTION (P0 / P1 Launch Blockers)

1. **Deploy Admin Management Portal to Vercel**: Publish `admin-portal` module to production Vercel project for live KYC and store operations access.
2. **Configure Production FCM Push Messaging**: Setup Firebase Cloud Messaging credentials for instant push notifications on mobile devices.
3. **Enforce Strict Production Feature Flags**: Verify `canUseDevMockFallbacks` remains hardcoded `false` across all production bundle exports.

---

## 2. CAN FIX AFTER LAUNCH (P2 / P3 Post-Launch Improvements)

1. **Shared TypeScript API Package**: Consolidate client DTO definitions into `@fixkart/api-client`.
2. **WebSocket STOMP Engine**: Upgrade short-polling synchronization to persistent WebSocket connections.
3. **Redis Session Store**: Activate distributed lock management on inventory reservations.
