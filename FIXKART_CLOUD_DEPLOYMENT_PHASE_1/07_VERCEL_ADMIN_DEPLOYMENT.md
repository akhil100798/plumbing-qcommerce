# FixKart Cloud Deployment — Phase 1: Admin & CRM Portal Deployment

**Execution Date:** 2026-10-27  
**DevOps Engineer / Full-Stack Architect:** Principal Full-Stack Engineer  
**Project Name:** `admin-portal`  
**Production URL:** `https://admin-portal-ten-weld.vercel.app`  
**Hosting Platform:** Vercel (Next.js Managed Platform)

---

## 1. Build and Deployment Metrics

| Metric | Details |
|---|---|
| **Root Directory** | `plumbing-qcommerce/admin-portal` |
| **Framework** | Next.js 15 (App Router / TypeScript / Tailwind CSS) |
| **Install Command** | `npm install` |
| **Build Command** | `next build` |
| **Build Duration** | `30 seconds` |
| **Target Commit** | `947f302c0fd323bb895e69bf1c1794bfa293c06d` |
| **Verified Deployment URL** | `https://admin-portal-5aafqusxs-sirupuramakhil-2873s-projects.vercel.app` |
| **Promotion Deployment ID** | `H1H3ryqJov7hkJFyZMH3MQMq1jps` |
| **Production Alias Assignment** | `https://admin-portal-ten-weld.vercel.app` (SUCCESS) |

---

## 2. Core Functional Modules Deployed

1. **Dashboard & Operations Management:** Real-time metrics for orders, active plumbers, delayed assignments, and store pickups.
2. **Plumber Manager & KYC Approval:** Detailed plumber verification workflows, KYC document review, and performance tracking.
3. **Finance & Payouts:** Plumber payouts, store settlements, commission reports, and refund management.
4. **Marketing & Promotions:** Campaign creation, banner scheduling, and discount offer administration.
5. **Launch Roster & Audit:** Operational readiness checklist and audit history tracking.

---

## 3. Live Smoke Test Evidence

- **HTTP Request:** `GET https://admin-portal-ten-weld.vercel.app`
- **HTTP Status:** `200 OK`
- **Edge Latency:** `409 ms`
- **HTML Payload Size:** `6,552 bytes`
- **HTML Title:** `<title>PlumbCommerce | Super Admin Portal</title>`
- **Result:** 100% OPERATIONAL
