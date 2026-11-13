# FIXKART PLUMBER APP — TECHNICAL IMPLEMENTATION REPORT

This document provides a comprehensive technical audit of the Google Stitch visual overhaul implemented inside `plumbing-qcommerce/plumber-app/`.

---

## 1. Architectural Architecture & Approach

The implementation replaces the visual presentation layer while strictly retaining the existing Redux slices, Axios API service layers, mock policy fallback mechanisms, token persistence (`expo-secure-store`), and navigation parameters.

### Tech Stack
- **Framework:** React Native 0.79.5 / Expo SDK 53
- **Navigation:** `@react-navigation/native` & `@react-navigation/stack` / `@react-navigation/bottom-tabs` (v7)
- **State Management:** `@reduxjs/toolkit` & `react-redux`
- **Networking:** `axios` with global interceptors and offline mock failover
- **Vector Assets:** `react-native-svg` (63 optimized vector icons)
- **Test Harness:** `vitest` + `react-test-renderer` (12 test suites, 43 automated unit tests)

---

## 2. Screen Implementation Breakdown (All 20 Stitch Screens)

### Batch 1: Authentication & Onboarding
1. **Screen 01 — Splash (`01_fixkart_splash` -> `src/screens/auth/SplashScreen.tsx`):**
   - Implements navy brand background (`#0A1E4A`), floating FixKart mascot illustration, circular wrench emblem, and live system boot sequence.
   - Automatically verifies existing bearer tokens via `tokenStorage.getToken()`, bootstrapping authenticated plumbers into `MainTab` or redirecting guests to `LoginScreen`.

2. **Screen 02 — Login (`02_fixkart_login` -> `src/screens/auth/LoginScreen.tsx`):**
   - Features curved header with plumber mascot graphic, dual tab switch ("Mobile Number" vs "Email ID"), styled `+91` country code prefix input, password input with toggle, and "Remember Me" checkbox.
   - Seamlessly calls `authService.loginWithPhone()` / `authService.loginWithEmail()`.

3. **Screen 03 — OTP Verification (`03_fixkart_otp` -> `src/screens/auth/OtpScreen.tsx`):**
   - Features concentric security shield graphic, 6 independent PIN input boxes with auto-focus advancing and backspace retreat, dynamic 30-second resend countdown timer, and "Verify & Proceed" primary button.
   - Integrates with `authService.verifyOtp()` and writes access credentials to secure storage.

### Batch 2: Job Lifecycle & Dispatch
4. **Screen 04 — Plumber Dashboard (`04_fixkart_dashboard` -> `src/screens/dashboard/DashboardScreen.tsx`):**
   - Implements curved top header displaying plumber name, circular avatar with online status ring, interactive "Online / Offline" switch toggle, weekly earnings metric card, and upcoming/assigned job alert cards.
   - Dispatches `jobService.getIncomingOffer()` and handles live state polling.

5. **Screen 05 — Incoming Job Request (`05_fixkart_incomingjob` -> `src/screens/jobs/IncomingJobRequestScreen.tsx`):**
   - Renders animated countdown ring (30s timeout), service title, estimated payout chip (`₹450`), distance badge (`2.4 km`), location address, and side-by-side "Decline" (danger red) and "Accept Job" (stitch green) actions.
   - Preserves backend conflict checks (`jobService.acceptJob()`, `jobService.declineJob()`).

6. **Screen 06 — Active Job Overview (`06_fixkart_activejob` -> `src/screens/jobs/ActiveJobScreen.tsx`):**
   - Displays real backend job ID (`#FK-8921`), service title, customer name, contact card with SVG phone and chat buttons, itemized service checklist, and "Navigate to Customer" CTA.
   - Verifies customer GPS coordinates before enabling navigation routing.

7. **Screen 07 — Navigation (`07_fixkart_navigation` -> `src/screens/jobs/NavigationScreen.tsx`):**
   - Features turn-by-turn guidance header ("Turn Right onto MG Road in 200m"), interactive `RouteMap` canvas rendering plumber marker and destination pin, floating call customer button, and anchored "End Trip / Reached" action dock.
   - Triggers `jobService.markArrived()` upon arrival.

8. **Screen 08 — Reached Customer (`08_fixkart_reachedcustomer` -> `src/screens/jobs/ReachedCustomerScreen.tsx`):**
   - Visualizes location verification with concentric radar waves, verified arrival pin, customer address confirmation, safety guidelines checklist, and "Confirm Arrival" button.
   - Updates backend job status to `ARRIVED`.

9. **Screen 09 — Start Work (`09_fixkart_startwork` -> `src/screens/jobs/StartWorkScreen.tsx`):**
   - Renders pre-work inspection checklist, initial diagnostic notes input, safety acknowledgment switch, and high-emphasis "Begin Service" button.
   - Transitions job status to `IN_PROGRESS` or opens `DiagnosisScreen` if quotation revision is required.

### Batch 3: Material Workflow & Store Self-Pickup
10. **Screen 10 — Material Request (`10_fixkart_materialrequest` -> `src/screens/materials/MaterialRequestScreen.tsx`):**
    - Features catalog search bar with vector magnifying glass, categorized parts list (Pipes, Valves, Joints, Faucets), stepper increment/decrement buttons (`+` / `-`), custom part write-in form, and bottom total estimation dock.
    - Submits request to `materialService.createRequest()`.

11. **Screen 11 — Material Approval Status (`11_fixkart_materialapproval` -> `src/screens/materials/MaterialApprovalStatusScreen.tsx`):**
    - High-contrast green header indicating customer authorization status, approved bill of materials breakdown, itemized pricing, and real-time status tracker (Awaiting Customer -> Approved -> Store Packing).
    - Syncs with `materialService.getRequestStatus()`.

12. **Screen 12 — Material Tracking & Store Pickup (`12_fixkart_materialtracking` -> `src/screens/materials/MaterialTrackingScreen.tsx`):**
    - **Crucial Architecture:** Strictly adheres to FixKart MVP store self-pickup model (no courier workflow).
    - Renders 5-step pickup progress stepper: Order Placed -> Store Packing -> Ready at Counter -> Plumber Collected -> En Route to Customer. Displays partner hardware store address, counter pickup OTP, and "Confirm Material Collection" button.
    - Dispatches `materialService.confirmPickup()`.

### Batch 4: Photo Evidence & Work Completion
13. **Screen 13 — Before Photos (`13_fixkart_beforephotos` -> `src/screens/photos/BeforePhotosScreen.tsx`):**
    - 2x2 photo slot grid with vector camera trigger, gallery attachment, thumbnail previews with removal cross, and strict minimum photo count validation (at least 2 photos required before proceeding).
    - Integrates with `expo-image-picker` and `jobService.uploadPhotos()`.

14. **Screen 14 — After Photos (`14_fixkart_afterphotos` -> `src/screens/photos/AfterPhotosScreen.tsx`):**
    - Side-by-side Before/After comparison carousel, post-repair photo upload slots, "Repair Verified" badge, and "Proceed to Billing" action.
    - Uploads completion evidence to backend storage.

15. **Screen 15 — Complete Service (`15_fixkart_completeservice` -> `src/screens/completion/CompleteServiceScreen.tsx`):**
    - Celebratory completion view with confetti motif, bold checkmark circle, customer digital signature / OTP validation, final invoice breakdown (labor + materials), plumber net payout chip, and "Collect Payment & Close Job" button.
    - Transitions job to `COMPLETED` via `jobService.completeJob()`.

### Batch 5: Account, Earnings & Drawer
16. **Screen 16 — Earnings Overview (`16_fixkart_earnings` -> `src/screens/business/EarningsScreen.tsx`):**
    - Curved navy banner showing week's total earnings (`₹8,450`), 3-column KPI card (Completed Jobs, Hours Online, Rating), 7-day bar chart visualization, and automated payout timeline notice.
    - Queries `earningsService.getWeeklyEarnings()`.

17. **Screen 17 — Wallet (`17_fixkart_wallet` -> `src/screens/business/WalletScreen.tsx`):**
    - High-contrast wallet balance card, quick action buttons ("Withdraw to Bank", "Add Account"), itemized ledger of recent job earnings and withdrawal debits, and zero-emoji compliance.
    - Interacts with `walletService.getWalletDetails()`.

18. **Screen 18 — Job History (`18_fixkart_jobhistory` -> `src/screens/business/JobHistoryScreen.tsx` & `JobsScreen.tsx`):**
    - Segmented filter tabs ("All", "Completed", "Cancelled"), itemized historical job cards showing date, customer name, service type, duration, and earnings badge, with tap-to-inspect modal.
    - Backed by `phase2JobRepository` and `jobService.getJobHistory()`.

19. **Screen 19 — Profile (`19_fixkart_profile` -> `src/screens/profile/ProfileScreen.tsx`):**
    - User avatar with edit button, verified badge, aggregate rating star (`4.9 (128 reviews)`), stats row (Jobs Done, Experience, Reliability), KYC document status, bank details, and settings list.
    - Interacts with `profileService.fetchProfile()` and `kycService`.

20. **Screen 20 — App Drawer (`20_fixkart_drawer` -> `src/screens/profile/DrawerMenuScreen.tsx`):**
    - Slide-out side drawer with plumber header, online/offline switch, quick links to Home, Jobs, Materials, Earnings, KYC, Support, Settings, and red Sign Out CTA.
    - Dispatches `authSlice.logout()` with token clearance.

---

## 3. Reconciled Additional Milestone D Screens

1. **`DiagnosisScreen.tsx`:** Detailed diagnostic inspection checklists, labor cost calculators, quotation revisions, and customer authorization gates.
2. **`StoreSelectionScreen.tsx`:** Nearby hardware store locator with radial distance calculations and store inventory previews.
3. **`MaterialsScreen.tsx`:** Active material requisitions dashboard accessible directly from the bottom tab bar.
4. **`ChatScreen.tsx`:** In-app real-time messaging interface between assigned plumber and customer.
