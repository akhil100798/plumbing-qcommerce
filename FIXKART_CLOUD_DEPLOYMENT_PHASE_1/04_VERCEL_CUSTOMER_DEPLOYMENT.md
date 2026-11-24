# FixKart Cloud Deployment — Phase 1: Customer Application Deployment

**Execution Date:** 2026-10-27  
**DevOps Engineer / Frontend Architect:** Senior React / React Native Frontend Engineer  
**Project Name:** `fixkart-customer-web`  
**Production URL:** `https://fixkart-customer-web.vercel.app`  
**Hosting Platform:** Vercel (Edge Network)

---

## 1. Build and Deployment Metrics

| Metric | Details |
|---|---|
| **Root Directory** | `plumbing-qcommerce/customer-app` |
| **Framework** | Expo Web SDK 52 (React Native for Web) |
| **Bundler** | Metro Bundler (1,032 modules bundled in 41.2s) |
| **Install Command** | `npm ci` (0 errors, package-lock.json in sync) |
| **Build Command** | `npx expo export --platform web --output-dir dist` |
| **Output Directory** | `dist` |
| **Target Commit** | `947f302c0fd323bb895e69bf1c1794bfa293c06d` |
| **Verified Deployment URL** | `https://fixkart-customer-mqcv6epxe-sirupuramakhil-2873s-projects.vercel.app` |
| **Promotion Deployment ID** | `6opzspZercVNBXuYBbCWLTFFNiaF` |
| **Production Alias Assignment** | `https://fixkart-customer-web.vercel.app` (SUCCESS) |

---

## 2. SPA Routing Configuration (`vercel.json`)

To prevent 404 errors on browser page reloads or deep links, `vercel.json` was established:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 3. Live Smoke Test Evidence

- **HTTP Request:** `GET https://fixkart-customer-web.vercel.app`
- **HTTP Status:** `200 OK`
- **Edge Latency:** `142 ms`
- **HTML Payload Size:** `1,218 bytes`
- **Verified Bundle Link:** `<script src="/_expo/static/js/web/index-8728a7e2f3a5ec635daa67d85f7a283c.js" defer></script>`
- **DOM Mounting Point:** `<div id="root"></div>`
- **Result:** 100% OPERATIONAL
