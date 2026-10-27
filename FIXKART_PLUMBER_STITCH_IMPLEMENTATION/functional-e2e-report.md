# FIXKART PLUMBER APP — FUNCTIONAL END-TO-END VERIFICATION REPORT

This document records the end-to-end functional test execution across all user journeys in the Stitch-redesigned FixKart Plumber App.

---

## 1. Journey 1: Authentication & Session Management

| Step | Action Taken | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| **1.1** | Launch application on cold boot | Splash screen displays navy hero with mascot; checks secure storage | `tokenStorage.getToken()` invoked; redirects based on auth status | **PASS** |
| **1.2** | Navigate to Login screen | Screen renders curved hero, phone input with `+91` prefix, remember me switch | Renders without layout shift; input keyboard type set to `phone-pad` | **PASS** |
| **1.3** | Enter valid mobile number and submit | Submits phone to `authService.loginWithPhone()`; advances to OTP | Triggers SMS OTP dispatch; navigates to `OtpScreen` with phone param | **PASS** |
| **1.4** | Fill 6-digit OTP code | Focus moves automatically from box 1 to 6; resend countdown ticks | Focus advances seamlessly; countdown decrements from 30s to 0s | **PASS** |
| **1.5** | Tap "Verify & Proceed" | Verifies code with backend; persists auth token; transitions to Dashboard | Token stored in SecureStore; sets Redux `isAuthenticated: true` | **PASS** |

---

## 2. Journey 2: Job Dispatch, Navigation & Arrival

| Step | Action Taken | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| **2.1** | Toggle availability on Dashboard | Switch flips to "Online"; poll starts for incoming requests | Status updates to green "ONLINE"; incoming job listener active | **PASS** |
| **2.2** | Receive incoming job request | `IncomingJobRequestScreen` presents countdown timer, payout, location | 30s countdown animates; job details match backend payload | **PASS** |
| **2.3** | Decline job scenario | Taps "Decline"; verifies modal warning; retains offer until backend confirms | Backend decline endpoint called; screen returns safely to Dashboard | **PASS** |
| **2.4** | Accept job scenario | Taps "Accept Job"; verifies assignment lock | Dispatches `jobService.acceptJob()`; navigates to `ActiveJobScreen` | **PASS** |
| **2.5** | Validate customer coordinates | Checks customer lat/lng before allowing navigation | Prevents navigation if coordinates undefined; enables when valid | **PASS** |
| **2.6** | Trigger "Navigate to Customer" | Transitions to `NavigationScreen`; renders turn banner and `RouteMap` | Route map renders plumber & destination markers with ETA dock | **PASS** |
| **2.7** | Tap "End Trip / Reached" | Invokes `jobService.markArrived()`; transitions to `ReachedCustomerScreen` | Backend marks arrived; radar circles render customer address | **PASS** |
| **2.8** | Confirm arrival at door | Acknowledges arrival checklist; taps "Confirm Arrival" | Job status updates to `ARRIVED`; transitions to `StartWorkScreen` | **PASS** |

---

## 3. Journey 3: Diagnosis, Quotation & Store Self-Pickup

| Step | Action Taken | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| **3.1** | Pre-work checklist & start work | Plumber completes safety check; taps "Begin Service" | Transitions to `IN_PROGRESS` or opens `DiagnosisScreen` for estimate | **PASS** |
| **3.2** | Initial diagnosis & quotation | Plumber selects damaged parts, inputs labor quote, submits to customer | Dispatches quotation to customer app; awaits authorization | **PASS** |
| **3.3** | Material request catalog | Searches parts in `MaterialRequestScreen`; uses stepper `+`/`-` buttons | Items summed accurately in floating summary bar; request sent | **PASS** |
| **3.4** | Material approval tracking | Displays `MaterialApprovalStatusScreen` with real-time approval state | Customer authorization updates state to "Store Packing" | **PASS** |
| **3.5** | Store discovery & selection | Shows partner hardware store on `StoreSelectionScreen` with distance | Plumber selects nearest verified partner store for pickup | **PASS** |
| **3.6** | Material tracking (Store Pickup) | Renders 5-step self-pickup stepper; shows pickup counter OTP | Strictly enforces self-pickup model (no courier logic); OTP valid | **PASS** |
| **3.7** | Confirm collection at store | Plumber verifies package at store; taps "Confirm Material Collection" | Backend marks materials collected; job ready for completion | **PASS** |

---

## 4. Journey 4: Photo Evidence & Work Completion

| Step | Action Taken | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| **4.1** | Upload Before Photos | Prompts camera/gallery; enforces minimum 2 photos before proceeding | Photo grid populates; next CTA disabled until 2 photos added | **PASS** |
| **4.2** | Upload After Photos | Shows Before/After comparison; plumber uploads post-repair photos | Compares side-by-side; "Repair Verified" badge unlocked | **PASS** |
| **4.3** | Complete Service & Invoice | Displays final bill (Labor + Materials); shows plumber payout | Confetti header renders; invoice totals calculate accurately | **PASS** |
| **4.4** | Customer sign-off & payment | Collects payment / digital authorization; taps "Close Job" | Job transitioned to `COMPLETED`; returns to Dashboard | **PASS** |

---

## 5. Journey 5: Financials, Account & Profile

| Step | Action Taken | Expected Result | Actual Result | Status |
|---|---|---|---|---|
| **5.1** | Inspect Weekly Earnings | Displays weekly sum (`₹8,450`), 7-day bar chart, KPI breakdown | Accurately groups daily earnings into visual bars without overflow | **PASS** |
| **5.2** | Inspect Wallet & Transactions | Balance card shows available funds; itemized ledger has 0 emojis | Currency formatted with rupee vector icon; withdrawal enabled | **PASS** |
| **5.3** | Filter Job History | Switches between "All", "Completed", and "Cancelled" tabs | Filter updates list immediately; cards show service type & date | **PASS** |
| **5.4** | View Profile & KYC | Renders plumber avatar, star rating (`4.9`), verified KYC chips | All profile fields populated; documents indicate approved status | **PASS** |
| **5.5** | Drawer Menu & Logout | Slides open drawer; taps "Sign Out"; confirms modal | Auth token wiped; Redux reset; user redirected to `LoginScreen` | **PASS** |
