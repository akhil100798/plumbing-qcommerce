# Backend CORS Audit

## CORS Configuration Overview

- **Configuration File**: `backend/src/main/java/com/pqc/core/config/CorsConfig.java` & `SecurityConfig.java`
- **Property Key**: `CORS_ALLOWED_ORIGINS` (Configurable via environment variable)

## Configured Origins Matrix

| Client Application | Origin Pattern | Credentials Allowed | Wildcard Allowed | Security Status |
| ------------------ | -------------- | ------------------- | ---------------- | --------------- |
| Customer Web App | `http://localhost:3000`, `http://localhost:8081` | Yes (`true`) | No (`false`) | PASS |
| Store Web App | `http://localhost:3001`, `http://localhost:8082` | Yes (`true`) | No (`false`) | PASS |
| Plumber Web App | `http://localhost:3002`, `http://localhost:8083` | Yes (`true`) | No (`false`) | PASS |
| Admin Web App | `http://localhost:3003`, `http://localhost:8084` | Yes (`true`) | No (`false`) | PASS |
| Custom Staging Domains | Configured via `CORS_ALLOWED_ORIGINS` env var | Yes (`true`) | No (`false`) | PASS |
| Unauthorized Origin | `http://malicious-website.com` | No | Replaced / Blocked | PASS |

## Verification & Audit Findings
- **Wildcard + Credentials Constraint**: `allowCredentials(true)` is NEVER paired with wildcard origin `*`. Spring Security rejects this unsafe configuration at startup.
- **Preflight Support**: `OPTIONS` preflight requests are allowed with max age cache of 3600 seconds.
- **Allowed Headers**: `Authorization`, `Content-Type`, `X-Requested-With`, `Accept`, `Origin`.
- **Allowed Methods**: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`.
