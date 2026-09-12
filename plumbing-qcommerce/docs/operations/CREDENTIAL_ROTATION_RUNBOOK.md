# FixKart Credential Rotation Runbook (`CREDENTIAL_ROTATION_RUNBOOK.md`)

Procedures for rotating production secrets, JWT signing keys, and database credentials safely:

---

## 1. JWT Signing Key Rotation
1. Generate new 512-bit Base64 secret key.
2. Update environment variable `APP_JWT_SECRET` in Render Environment Settings.
3. Restart backend service. Active access tokens will expire naturally within 15 minutes; users will refresh token or log in cleanly.

---

## 2. Database Password Rotation
1. Update password in Render Managed PostgreSQL dashboard.
2. Update environment variable `SPRING_DATASOURCE_PASSWORD` in Render Backend Settings.
3. Restart backend application and verify database connection pools.
