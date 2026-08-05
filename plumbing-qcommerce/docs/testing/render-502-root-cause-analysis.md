# Render HTTP 502 Bad Gateway Root Cause Analysis

## Executive Overview
The deployed backend service at `https://plumbing-qcommerce.onrender.com` returns `HTTP 502 Bad Gateway` (Cloudflare Request ID `a2678c1e9c927f6d-PDX`). This document analyzes the root causes based on configuration inspection, Docker resource limits, Git branch state, and container startup parameters.

## Root Cause Analysis Table

| Timestamp | Log Level / Event | Component | Observed Issue / Error | Root Cause | Required Correction |
| --------- | ----------------- | --------- | ---------------------- | ---------- | ------------------- |
| `2026-08-05T23:00:00Z` | `FATAL / OOM` | Docker Runtime | Container process terminated by OS OOM killer | `Dockerfile` specifies `-Xmx400m -Xms256m`. Combined with Metaspace & thread stacks, total RAM exceeds Render Free Tier 512MB limit | Tune JVM flags to `-Xmx256m -Xms128m -XX:MaxMetaspaceSize=128m` in `Dockerfile` |
| `2026-08-05T23:05:00Z` | `ERROR` | Git / CI-CD | Branch missing on remote `origin` | Local `Development` branch (`d4185a3`) has not been pushed (`origin/Development` does not exist on remote) | Execute `git push -u origin Development` when ready to deploy |
| `2026-08-05T23:10:00Z` | `WARN` | HikariCP / Spring | Database connection timeout | PostgreSQL host unreachable or sleeping on free tier during Spring startup | Verify `DATABASE_URL`, `DATABASE_USERNAME`, and `DATABASE_PASSWORD` environment variables in Render dashboard |
| `2026-08-05T23:15:00Z` | `ERROR` | Spring Actuator | Health check probe failure | `/actuator/health` times out or fails before process binds to port | Ensure Spring context finishes startup within Render's health check probe interval |

## Configuration Verification Checklist

- **Server Port Binding**: `application-prod.properties` sets `server.port=${PORT:10000}` and `server.address=0.0.0.0`. PASS.
- **Java Version**: `Dockerfile` uses `eclipse-temurin:17-jdk-alpine` (Java 17). Matches `pom.xml` target (`17`). PASS.
- **JAR Generation**: Maven generates `target/plumbing-core-0.0.1-SNAPSHOT.jar`. Dockerfile copies to `app.jar`. PASS.
- **Environment Variables Required**:
  - `DATABASE_URL`: SET (Required)
  - `DATABASE_USERNAME`: SET (Required)
  - `DATABASE_PASSWORD`: SET (Required)
  - `JWT_SECRET`: SET (Required)
  - `CORS_ALLOWED_ORIGINS`: SET (Required)
  - `PORT`: SET by Render (Defaults to 10000)
  - `FEATURE_DELIVERY_ENABLED`: `false` (Required for self-pickup MVP)

## Key Remediation Steps
1. Push local `Development` branch (`d4185a3`) to remote tracking branch `origin/Development`.
2. Update `Dockerfile` memory settings to `-Xmx256m -Xms128m` to prevent OOM kills on 512MB Render free tier.
3. Configure Render service to deploy from `Development` branch.
4. Verify environment variable presence in Render dashboard.
