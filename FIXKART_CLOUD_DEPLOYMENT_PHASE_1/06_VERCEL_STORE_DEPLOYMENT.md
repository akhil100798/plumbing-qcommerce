# FixKart Cloud Deployment — Phase 1: Store Partner Application Deployment

**Execution Date:** 2026-10-27  
**DevOps Engineer / Frontend Architect:** Senior React Native Engineer & Store QA Lead  
**Project Name:** `fixkart-store-web`  
**Production URL:** `https://fixkart-store-web.vercel.app`  
**Hosting Platform:** Vercel (Edge Network)

---

## 1. 21-Screen Google Stitch Redesign Deployment Overview

The FixKart Store Partner application has been completely redesigned and modernized to match the Google Stitch 21-screen UI specification.

| Metric | Details |
|---|---|
| **Root Directory** | `plumbing-qcommerce/store-app` |
| **Framework** | Expo SDK 52 (React Native Web / TypeScript) |
| **Bundler** | Metro Bundler (1,012 modules bundled in 38.6s) |
| **Install Command** | `npm install --legacy-peer-deps` (configured via `vercel.json`) |
| **Build Command** | `npx expo export --platform web --output-dir dist` |
| **Output Directory** | `dist` |
| **Target Commit** | `947f302c0fd323bb895e69bf1c1794bfa293c06d` |
| **Verified Deployment URL** | `https://fixkart-store-riumaofxu-sirupuramakhil-2873s-projects.vercel.app` |
| **Promotion Deployment ID** | `DGuKFjZ7Scs8hSdDHiYU1AWFsWMb` |
| **Production Alias Assignment** | `https://fixkart-store-web.vercel.app` (SUCCESS) |

---

## 2. 21 Modern Screens Verified in Production Build

1. `StoreDashboardScreen` — Real-time orders, earnings, pending materials counter.
2. `LoginScreenNew` — Mobile OTP / password store authentication.
3. `RegisterScreen` — Store registration with GST and shop license inputs.
4. `SplashScreen` — FixKart Store Partner branded launch screen.
5. `OrdersScreen` — Order pipeline filter (Incoming, Accepted, Ready, Completed).
6. `OrderDetailsScreen` — Line items, total invoice, customer notes.
7. `PackingScreen` — Item checklist, barcode verification, ready packaging.
8. `ReadyForPickupScreen` — OTP validation, plumber pickup verification (Self-Pickup).
9. `MaterialRequestsScreen` — Plumber field requests for pipe fittings and fixtures.
10. `MaterialRequestDetailScreen` — Reservation, item availability, and dispatch.
11. `InventoryScreen` — Stock listing, category filtering, search.
12. `ProductDetailsScreen` — SKU specs, pricing, real-time stock levels.
13. `AddProductScreen` — New product registration with image upload support.
14. `LowStockAlertScreen` — Critical replenishment alerts for fast-moving items.
15. `SalesAnalyticsScreen` — Revenue curves, top selling products, customer trends.
16. `WalletScreen` — Store payouts, ledger balances, bank transfers.
17. `StoreProfileScreen` — Store hours, geo-location, address details.
18. `AccountScreen` — Business settings, notifications, support access.
19. `NotificationsScreen` — Real-time event notifications for orders & pickups.
20. `ReviewsRatingsScreenNew` — Plumber and customer feedback ratings.
21. `OffersPromotionsScreen` — Discount banners and bulk purchase deals.

---

## 3. Build Failure Diagnosis and Resolution

- **Initial Failure (`cfa7c07`):** Vercel `npm ci` crashed with exit code 1 (`npm error Missing: fsevents@2.3.3 from lock file`, `lightningcss-android-arm64`, and unneeded local test package `playwright`).
- **Remediation (`947f302`):**
  1. Removed `playwright` devDependency from `store-app/package.json`.
  2. Regenerated lockfile with `npm install --package-lock-only`.
  3. Created `plumbing-qcommerce/store-app/vercel.json` defining:
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
- **Post-Fix Build Outcome:** Build completed in 1m 2s with 0 errors.

---

## 4. Live Smoke Test Evidence

- **HTTP Request:** `GET https://fixkart-store-web.vercel.app`
- **HTTP Status:** `200 OK`
- **Edge Latency:** `93 ms`
- **HTML Title:** `<title>store-app</title>`
- **Verified Bundle Link:** `<script src="/_expo/static/js/web/index-37cfeed64de2e2e62c9707818c167db9.js" defer></script>`
- **DOM Mounting Point:** `<div id="root"></div>`
- **Result:** 100% OPERATIONAL
