# Phase 14G Mobile E2E UAT Report

This document records the user acceptance testing (UAT) results for the real mobile E2E flows in Phase 14G.

## 1. Test Environment

- **Backend Base URL**: `https://plumbing-qcommerce.onrender.com`
- **Mock Fallback Flag**: `EXPO_PUBLIC_ALLOW_MOCK_FALLBACKS=false`
- **Customer Account**: `customer@plumbcommerce.com` / `password`
- **Plumber Account**: `plumber@plumbcommerce.com` / `password`
- **Store Manager Account**: `store@plumbcommerce.com` / `password`

## 2. E2E Test Execution Summary

### Flow A: Customer Service Request & Plumber Acceptance
- **Steps**:
  1. Customer logs in and views/tracks active job or submits repair request.
  2. Plumber logs in, turns on shift switch (`ONLINE`), fetches incoming requests.
  3. Plumber accepts the kitchen faucet leak repair job.
  4. Plumber starts work.
- **UAT Status**: **PASS**
- **Details**: Plumber active job recovery works on mount, recovering state correctly from the backend endpoint `/orders/plumber`.

### Flow B: Mid-Job Material Request & Customer Approval
- **Steps**:
  1. Plumber requests parts (`CPVC Pipe 1/2 inch`) during work.
  2. Customer navigates to `MaterialApprovalScreen` and fetches the pending product order.
  3. Customer clicks "Approve & Pay" which triggers `CartRepository.confirmPayment`.
- **UAT Status**: **PASS**
- **Details**: All items are loaded from the backend, and payment confirms stock reservation changes correctly.

### Flow C: Store Order Dispatching & Delivery Tracking
- **Steps**:
  1. Store manager gets the incoming material request, accepts, packs, and clicks assign rider.
  2. Available riders are loaded from `GET /api/v1/delivery/partners`. Store manager selects a rider.
  3. Rider starts delivery.
  4. Plumber tracks the delivery progress via 5s polling of `fetchMaterialDetails`.
- **UAT Status**: **PASS**
- **Details**: Polling works perfectly, transitions status from PENDING_APPROVAL -> APPROVED -> DELIVERING -> DELIVERED, and updates ETAs/rider details.

## 3. Verification Commands Run & Results

- **Backend compilation & tests**: Compiled successfully with unit tests passing.
- **Mobile typecheck & builds**:
  - Customer App: `npm run typecheck` & `npm run build` PASS
  - Plumber App: `npm run typecheck` & `npm run build` PASS
  - Store App: `npm run typecheck` & `npm run build` PASS

## 4. Final Verdict

- **CUSTOMER APP STAGING UAT**: **PASS**
- **PLUMBER APP STAGING UAT**: **PASS**
- **STORE APP STAGING UAT**: **PASS**
- **MOBILE STAGING READY**: **YES**
- **PRODUCTION READY**: **NO** (requires real payment gateway integration and SMS gateways in production profiles).
