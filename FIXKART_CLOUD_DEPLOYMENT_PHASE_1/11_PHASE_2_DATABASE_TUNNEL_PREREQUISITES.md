# FixKart Cloud Deployment — Phase 1: Phase 2 Database Tunnel Prerequisites

**Execution Date:** 2026-10-27  
**Database Architect / DevOps Engineer:** Principal Database Architect & Render Deployment Architect

---

## 1. Compliance Statement

As explicitly mandated in the Phase 1 specification:
> **Do not configure the local PostgreSQL tunnel in this phase.**

This constraint has been strictly adhered to throughout Phase 1 execution. The local PostgreSQL instance remains untouched, and no tunnel daemon (ngrok, Cloudflare Tunnel, or SSH reverse tunnel) has been launched.

---

## 2. Prerequisites for Phase 2 Tunnel Configuration

Before executing Phase 2, the following technical prerequisites must be validated:

### 1. Local Database Readiness
- **Database Engine:** PostgreSQL 16+ running locally on `localhost:5432`.
- **Database Name:** `plumbing_qcommerce` (or designated staging database).
- **Flyway Migrations:** Schema must be validated through Flyway migration script `V36` (`V1__baseline.sql` through `V36__add_performance_and_security_indexes.sql`).
- **Target Guard:** `PostgresTestTargetGuard` must confirm that the target database is not production.

### 2. Tunnel Infrastructure Options
- **Option A (Cloudflare Tunnel - Recommended):**
  - Install `cloudflared`.
  - Configure persistent named tunnel routing TCP traffic to `localhost:5432`.
  - Zero open inbound ports required on the local network router.
- **Option B (Ngrok TCP Tunnel):**
  - `ngrok tcp 5432` providing a public hostname and port (e.g. `tcp://0.tcp.ngrok.io:12345`).
- **Option C (SSH Reverse Tunnel):**
  - Reverse SSH port forwarding to a cloud bastion server.

### 3. Render Backend Configuration Plan
Once the secure tunnel endpoint is established in Phase 2, the following environment variables will be configured on Render:
```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://<TUNNEL_HOST>:<TUNNEL_PORT>/plumbing_qcommerce?sslmode=prefer
SPRING_DATASOURCE_USERNAME=<DB_USER>
SPRING_DATASOURCE_PASSWORD=<DB_PASSWORD>
SPRING_JPA_HIBERNATE_DDL_AUTO=validate
SPRING_FLYWAY_ENABLED=true
SPRING_FLYWAY_BASELINE_ON_MIGRATE=true
```

### 4. Safety & Data Isolation Checklist
1. Strict read/write authorization for the staging application user.
2. Connection timeout & keep-alive parameters configured to tolerate tunnel reconnections.
3. Automated database backup before opening any external network bridge.
4. Monitoring alerts for database latency over the tunnel bridge.

---

## 3. Immediate Next Steps

Upon authorization by the project lead to begin Phase 2:
1. Verify the local PostgreSQL service and test connection locally.
2. Launch the authorized secure TCP tunnel for port 5432.
3. Configure Render environment variables and execute deployment restart.
4. Validate backend health and database connectivity end-to-end.
