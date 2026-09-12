# FIXKART CUSTOMER APP — MISSING ASSET REPORT

**Date**: August 16, 2026  
**Source**: Stitch Project `projects/11152967491806546853` (FixKart Customer App)

---

## Status Overview

All visual assets (Logos, Marks, Navigation Icons, Category Icons, Status Indicators, Action Elements, and Onboarding Vectors) have been extracted directly from the Stitch designs and generated as clean SVGs into the repository asset hierarchy.

---

## Items Requiring External Photography / CDN URLs

| Screen / Element | Current Treatment | Why Not Local Raw Bitmap | Reference / Action |
| :--- | :--- | :--- | :--- |
| **Product Photos (e.g. CPVC Pipes, Angle Valves, Brass Couplers)** | Provided via CDN image URLs with genuine plumbing hardware specifications | Dynamic e-commerce products are loaded from the backend Catalog API (`/api/v1/catalog/products`) | Managed via backend Product Catalog |
| **Plumber Profile Photos** | High-resolution authenticated profile URLs (`photoUrl` in `AuthUserDto` / `ServiceOrder`) | Plumber photos are dynamic identity records returned by the backend | Handled through live backend plumber profile API |
| **Live Map Tile Rendering** | Native UI vector map simulation | Map tiles for real-time driver tracking require a live Google Maps SDK API key | Native Map rendering |

**Total Missing Critical Vector Assets**: `0` (All required vector brand and UI assets extracted and created).
