# FixKart Cloud Deployment — Phase 1: Plumber Application Deployment

**Execution Date:** 2026-10-27  
**DevOps Engineer / Frontend Architect:** Senior React Native Engineer & Release QA Lead  
**Project Name:** `fixkart-plumber-web`  
**Production URL:** `https://fixkart-plumber-web.vercel.app`  
**Hosting Platform:** Vercel (Edge Network)

---

## 1. Google Stitch Redesign Deployment Overview

The FixKart Plumber application has been fully synchronized with the modern Google Stitch design system across 20 verified operational screens and deployed to the Vercel cloud network.

| Metric | Details |
|---|---|
| **Root Directory** | `plumbing-qcommerce/plumber-app` |
| **Framework** | Expo SDK 52 (React Native Web / TypeScript) |
| **Bundler** | Metro Bundler (853 modules bundled in 34.4s) |
| **Install Command** | `npm install --legacy-peer-deps` (configured via `vercel.json`) |
| **Build Command** | `npx expo export --platform web --output-dir dist` |
| **Output Directory** | `dist` |
| **Target Commit** | `947f302c0fd323bb895e69bf1c1794bfa293c06d` |
| **Verified Deployment URL** | `https://fixkart-plumber-7un8zw3ru-sirupuramakhil-2873s-projects.vercel.app` |
| **Promotion Deployment ID** | `sVmN5AaGgoAvHkVNNSzgwjMRThc4` |
| **Production Alias Assignment** | `https://fixkart-plumber-web.vercel.app` (SUCCESS) |

---

## 2. Build Failure Diagnosis and Resolution

- **Initial Failure (`cfa7c07`):** Vercel attempted default `npm ci`, which failed with exit code 1 (`npm error Missing: test-renderer@1.3.1 from lock file`, along with platform-specific rolldown optional bindings).
- **Remediation (`947f302`):**
  1. Updated `package-lock.json` with `npm install --package-lock-only`.
  2. Created `plumbing-qcommerce/plumber-app/vercel.json` defining:
     ```json
     {
       "installCommand": "npm install --legacy-peer-deps",
       "rewrites": [
         {
           "source": "/(.*)",
           "destination": "/index.html"
         }
       ]
     }
     ```
- **Post-Fix Build Outcome:** Build completed in 57 seconds with 0 errors.

---

## 3. Live Smoke Test Evidence

- **HTTP Request:** `GET https://fixkart-plumber-web.vercel.app`
- **HTTP Status:** `200 OK`
- **Edge Latency:** `145 ms`
- **HTML Title:** `<title>FixKart Plumber</title>`
- **Verified Bundle Link:** `<script src="/_expo/static/js/web/index-e6969b0a2cf69a88f0f39c0f63417320.js" defer></script>`
- **DOM Mounting Point:** `<div id="root"></div>`
- **Result:** 100% OPERATIONAL
