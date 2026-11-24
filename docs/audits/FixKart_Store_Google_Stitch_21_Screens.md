# FixKart Store Partner — Google Stitch Complete Screen Design Pack

Source audit: connected GitHub repository `akhil100798/plumbing-qcommerce`, branch `Development-2`, commit `b8fa754b7796c50863091c1da123fddbd8fb981a`. This is the latest **remotely accessible branch inspected**, NOT the newer local-only `candidate/staging-rc-001`. Screens in that local candidate may differ.

## Screen inventory (21 active routes)

| # | Screen | Navigation | Implementation observation |
|---|---|---|---|
| 01 | Splash / Session Check | Auth → Splash | Active |
| 02 | Store Partner Login | Auth → Login | Active (LoginScreenNew) |
| 03 | Register Store | Auth → Register | Active |
| 04 | Home / Store Dashboard | Main → Home | Active |
| 05 | Orders List | Main → Orders | Active but currently static demo UI |
| 06 | Order Details | Stack → OrderDetails | Active but currently static demo UI |
| 07 | Packing Checklist | Stack → Packing | Active but currently simulated UI |
| 08 | Ready for Plumber Pickup | Stack → ReadyForPickup | Active backend-connected screen |
| 09 | Inventory List | Main → Inventory | Active but currently static demo UI |
| 10 | Product Details | Stack → ProductDetails | Active but currently static demo UI |
| 11 | Add / Edit Product | Stack → AddProduct | Active UI; catalog write is unsupported in staging |
| 12 | Low Stock Alerts | Stack → LowStockAlert | Active but currently static demo UI |
| 13 | Material Requests Queue | Main → Materials | Active and API-backed |
| 14 | Material Request Detail & Workflow | Stack → MaterialRequestDetail | Active and API-backed |
| 15 | Sales Analytics | Stack → SalesAnalytics | Active but currently static charts |
| 16 | Wallet & Earnings | Stack → Wallet | Active but currently hardcoded financial demo |
| 17 | Reviews & Ratings | Stack → ReviewsRatings | Active and API-backed, with demo fallback labels |
| 18 | Offers & Promotions | Stack → OffersPromotions | Active route; staging feature currently disabled |
| 19 | Notifications Center | Stack → Notifications | Active and API-backed |
| 20 | Store Profile / Business Details | Stack → StoreProfile | Active fetch; submenus mostly informational alerts |
| 21 | Account & Settings | Main → Account | Active |

**Not active:** `DispatchAssignmentScreen` (delivery-rider flow is commented out), older `LoginScreen.tsx`, older `ReviewsRatingsScreen.tsx`. Do not create rider-assignment pages.

**Implementation caution:** UI mockups are designs only. Multiple existing screens show hardcoded sample data or alert-only actions even where backend services exist; do not present mock wallet payouts, reorders, catalog saves, customer deliveries or KYC as deployed functionality.

## Common visual and product instructions

Design a high-fidelity MOBILE-FIRST (390x844) screen for **FixKart Store Partner**, the Indian plumbing/hardware store operations app. Use a premium practical B2B design: royal blue #1E4FD8, success green #1EA34A, amber #FF9F1C, danger red #E5484D, background #F5F6F8, white cards, near-black text #12141A, subtle borders #EAECEF, rounded 12–16px cards, clear Inter-like typography, restrained icons, accessible contrast, 8pt spacing, minimum 44px tap areas, prices formatted ₹, and realistic synthetic Indian hardware items. No stock photography clutter. Prioritize scannable operational information and clear CTAs. Design only the UI, not implementation code. Keep all actions consistent with FixKart's MVP: the **assigned plumber self-picks up materials from the store**; do not introduce rider assignment, delivery partner, courier tracking, OTP handover, or customer delivery workflows. Do not show fake banking settlement as completed. Include polished loading, empty, error, and disabled states where relevant.

---

## 01 — Splash / Session Check

**Navigation:** Auth → Splash  
**Current code:** Active  
**Purpose:** Brand introduction and token/session validation; redirects to Login or Home.

**Standalone Google Stitch prompt — copy and paste:**

```text
Design a high-fidelity MOBILE-FIRST (390x844) screen for **FixKart Store Partner**, the Indian plumbing/hardware store operations app. Use a premium practical B2B design: royal blue #1E4FD8, success green #1EA34A, amber #FF9F1C, danger red #E5484D, background #F5F6F8, white cards, near-black text #12141A, subtle borders #EAECEF, rounded 12–16px cards, clear Inter-like typography, restrained icons, accessible contrast, 8pt spacing, minimum 44px tap areas, prices formatted ₹, and realistic synthetic Indian hardware items. No stock photography clutter. Prioritize scannable operational information and clear CTAs. Design only the UI, not implementation code. Keep all actions consistent with FixKart's MVP: the **assigned plumber self-picks up materials from the store**; do not introduce rider assignment, delivery partner, courier tracking, OTP handover, or customer delivery workflows. Do not show fake banking settlement as completed. Include polished loading, empty, error, and disabled states where relevant.

SCREEN: Splash / Session Check. Create a full-screen royal-blue splash scene with centered FixKart wrench/store-partner logo, prominent ‘FixKart’ wordmark and green-accent K, subtitle ‘Store Partner’, tagline ‘Parts that keep every repair going.’ Add soft geometric plumbing-part illustrations, not photos. Bottom small spinner and ‘Checking your partner session…’ caption with safe-area padding. The session check routes a valid user to Home and an expired/missing session to Login; do not show fake login buttons or extra onboarding screens.
```


## 02 — Store Partner Login

**Navigation:** Auth → Login  
**Current code:** Active (LoginScreenNew)  
**Purpose:** Email/password login, remember-me toggle, admin-contact recovery, and registration link.

**Standalone Google Stitch prompt — copy and paste:**

```text
Design a high-fidelity MOBILE-FIRST (390x844) screen for **FixKart Store Partner**, the Indian plumbing/hardware store operations app. Use a premium practical B2B design: royal blue #1E4FD8, success green #1EA34A, amber #FF9F1C, danger red #E5484D, background #F5F6F8, white cards, near-black text #12141A, subtle borders #EAECEF, rounded 12–16px cards, clear Inter-like typography, restrained icons, accessible contrast, 8pt spacing, minimum 44px tap areas, prices formatted ₹, and realistic synthetic Indian hardware items. No stock photography clutter. Prioritize scannable operational information and clear CTAs. Design only the UI, not implementation code. Keep all actions consistent with FixKart's MVP: the **assigned plumber self-picks up materials from the store**; do not introduce rider assignment, delivery partner, courier tracking, OTP handover, or customer delivery workflows. Do not show fake banking settlement as completed. Include polished loading, empty, error, and disabled states where relevant.

SCREEN: Store Partner Login. Design a welcoming partner login view: compact centered FixKart icon, ‘Welcome back’, ‘Manage your store and plumber pickups’, white login form card. Email address and masked password fields, eye visibility control, Remember me checkbox, ‘Forgot password?’ secondary link labelled ‘Contact administrator’, prominent ‘Log In’ button with loading/disabled state, ‘Register Store’ link. Include inline credential validation, wrong-password error banner and keyboard-safe layout. No SMS OTP login flow; do not invent a reset-password backend.
```


## 03 — Register Store

**Navigation:** Auth → Register  
**Current code:** Active  
**Purpose:** Store-manager onboarding with required business, contact, location and password fields.

**Standalone Google Stitch prompt — copy and paste:**

```text
Design a high-fidelity MOBILE-FIRST (390x844) screen for **FixKart Store Partner**, the Indian plumbing/hardware store operations app. Use a premium practical B2B design: royal blue #1E4FD8, success green #1EA34A, amber #FF9F1C, danger red #E5484D, background #F5F6F8, white cards, near-black text #12141A, subtle borders #EAECEF, rounded 12–16px cards, clear Inter-like typography, restrained icons, accessible contrast, 8pt spacing, minimum 44px tap areas, prices formatted ₹, and realistic synthetic Indian hardware items. No stock photography clutter. Prioritize scannable operational information and clear CTAs. Design only the UI, not implementation code. Keep all actions consistent with FixKart's MVP: the **assigned plumber self-picks up materials from the store**; do not introduce rider assignment, delivery partner, courier tracking, OTP handover, or customer delivery workflows. Do not show fake banking settlement as completed. Include polished loading, empty, error, and disabled states where relevant.

SCREEN: Register Store. Create a clear multi-section scrollable Store Registration page with progress sections ‘Manager’, ‘Store Details’, ‘Location’, ‘Security’. Preserve EVERY actual field: manager full name, email, 10-digit Indian mobile, store name, complete store address, latitude, longitude, password and confirm password. Use labeled inputs, latitude/longitude two-column row, show/hide password icons, required-field notation and validation messages for Indian phone, email, coordinate limits and password match/minimum 8 characters. Sticky ‘Create Store Account’ CTA; secondary ‘Already registered? Log in’. Do not replace latitude/longitude with map-only input.
```


## 04 — Home / Store Dashboard

**Navigation:** Main → Home  
**Current code:** Active  
**Purpose:** Overview, order pipeline, today’s sales, low stock, notifications and KYC notice.

**Standalone Google Stitch prompt — copy and paste:**

```text
Design a high-fidelity MOBILE-FIRST (390x844) screen for **FixKart Store Partner**, the Indian plumbing/hardware store operations app. Use a premium practical B2B design: royal blue #1E4FD8, success green #1EA34A, amber #FF9F1C, danger red #E5484D, background #F5F6F8, white cards, near-black text #12141A, subtle borders #EAECEF, rounded 12–16px cards, clear Inter-like typography, restrained icons, accessible contrast, 8pt spacing, minimum 44px tap areas, prices formatted ₹, and realistic synthetic Indian hardware items. No stock photography clutter. Prioritize scannable operational information and clear CTAs. Design only the UI, not implementation code. Keep all actions consistent with FixKart's MVP: the **assigned plumber self-picks up materials from the store**; do not introduce rider assignment, delivery partner, courier tracking, OTP handover, or customer delivery workflows. Do not show fake banking settlement as completed. Include polished loading, empty, error, and disabled states where relevant.

SCREEN: Home / Store Dashboard. Design an actionable store owner dashboard. Greeting header with dynamic store/manager name and notification bell with unread dot. High-emphasis royal-blue ‘Today’s Overview’ panel with date, New Orders, To Prepare/Ready for Pickup and Today’s Sales; all are dynamic, never use hardcoded stale dates. Below, slim KYC verification information banner that is informational until a real KYC flow exists. Four visual order-status quick links New / Processing / Ready / Completed. ‘Low Stock Alerts’ compact items with quantity, reorder threshold and View All; show only available actions. Quick link to material requests from plumbers. Fixed five-tab nav: Home, Orders, Inventory, Materials, Account.
```


## 05 — Orders List

**Navigation:** Main → Orders  
**Current code:** Active but currently static demo UI  
**Purpose:** All/New/Processing/Ready filters, order cards and details entry point.

**Standalone Google Stitch prompt — copy and paste:**

```text
Design a high-fidelity MOBILE-FIRST (390x844) screen for **FixKart Store Partner**, the Indian plumbing/hardware store operations app. Use a premium practical B2B design: royal blue #1E4FD8, success green #1EA34A, amber #FF9F1C, danger red #E5484D, background #F5F6F8, white cards, near-black text #12141A, subtle borders #EAECEF, rounded 12–16px cards, clear Inter-like typography, restrained icons, accessible contrast, 8pt spacing, minimum 44px tap areas, prices formatted ₹, and realistic synthetic Indian hardware items. No stock photography clutter. Prioritize scannable operational information and clear CTAs. Design only the UI, not implementation code. Keep all actions consistent with FixKart's MVP: the **assigned plumber self-picks up materials from the store**; do not introduce rider assignment, delivery partner, courier tracking, OTP handover, or customer delivery workflows. Do not show fake banking settlement as completed. Include polished loading, empty, error, and disabled states where relevant.

SCREEN: Orders List. Build a professional Orders list view with header ‘Orders’, search and filter icons, tabs All / New / Processing / Ready with dynamic counts, and vertical compact order cards. Each card shows order reference, created time, customer or linked service order, status chip, item quantity and total amount, with context-sensitive ‘View Details’, ‘Accept’, or ‘Continue Packing’ actions as appropriate. Add search/filter bottom sheet designs and empty/error states. Five-tab bottom navigation with Orders selected, only once. Make plumber store-pickup fulfillment explicit; no rider assignment or door delivery. Data shown should be illustrative but visually ready to bind to API.
```


## 06 — Order Details

**Navigation:** Stack → OrderDetails  
**Current code:** Active but currently static demo UI  
**Purpose:** Customer/order summary, items, totals, actions and packing route.

**Standalone Google Stitch prompt — copy and paste:**

```text
Design a high-fidelity MOBILE-FIRST (390x844) screen for **FixKart Store Partner**, the Indian plumbing/hardware store operations app. Use a premium practical B2B design: royal blue #1E4FD8, success green #1EA34A, amber #FF9F1C, danger red #E5484D, background #F5F6F8, white cards, near-black text #12141A, subtle borders #EAECEF, rounded 12–16px cards, clear Inter-like typography, restrained icons, accessible contrast, 8pt spacing, minimum 44px tap areas, prices formatted ₹, and realistic synthetic Indian hardware items. No stock photography clutter. Prioritize scannable operational information and clear CTAs. Design only the UI, not implementation code. Keep all actions consistent with FixKart's MVP: the **assigned plumber self-picks up materials from the store**; do not introduce rider assignment, delivery partner, courier tracking, OTP handover, or customer delivery workflows. Do not show fake banking settlement as completed. Include polished loading, empty, error, and disabled states where relevant.

SCREEN: Order Details. Design a detailed fulfillment page with back header ‘Order Details’ and share icon. Show order ID, placed time, current status and a compact step progress tracker. Contact/linked-service card for customer and assigned plumber when available, with phone action only when authorized. Itemized list with product names, unit price, requested quantities, and stock availability; bill breakdown and total payable; distinguish material amount from separate service invoice. Sticky bottom ‘Start Packing’ primary CTA and contextual secondary contact action. No spurious delivery charge or rider details in plumber-pickup orders. Include no-items and loading states.
```


## 07 — Packing Checklist

**Navigation:** Stack → Packing  
**Current code:** Active but currently simulated UI  
**Purpose:** Verify items, quality check, packaging, invoice and mark packed.

**Standalone Google Stitch prompt — copy and paste:**

```text
Design a high-fidelity MOBILE-FIRST (390x844) screen for **FixKart Store Partner**, the Indian plumbing/hardware store operations app. Use a premium practical B2B design: royal blue #1E4FD8, success green #1EA34A, amber #FF9F1C, danger red #E5484D, background #F5F6F8, white cards, near-black text #12141A, subtle borders #EAECEF, rounded 12–16px cards, clear Inter-like typography, restrained icons, accessible contrast, 8pt spacing, minimum 44px tap areas, prices formatted ₹, and realistic synthetic Indian hardware items. No stock photography clutter. Prioritize scannable operational information and clear CTAs. Design only the UI, not implementation code. Keep all actions consistent with FixKart's MVP: the **assigned plumber self-picks up materials from the store**; do not introduce rider assignment, delivery partner, courier tracking, OTP handover, or customer delivery workflows. Do not show fake banking settlement as completed. Include polished loading, empty, error, and disabled states where relevant.

SCREEN: Packing Checklist. Design a focused Packing Checklist for order #FK-10284, with four interactive-looking checklist rows: Verify Items (show 5/5), Quality Check, Secure Packaging and Add Invoice. Use connected step indicators, selected/done/blocked states, item quantities and a small packing-progress indicator. Sticky button ‘Mark as Packed’ enabled only when all required checks are complete; confirm modal. Show safe handling tip and subtle inventory warning when insufficient. After packing, the next state is Ready for Plumber Pickup, NOT dispatch or delivery rider tracking.
```


## 08 — Ready for Plumber Pickup

**Navigation:** Stack → ReadyForPickup  
**Current code:** Active backend-connected screen  
**Purpose:** Ready status, item summary, plumber collection confirmation and invoice action.

**Standalone Google Stitch prompt — copy and paste:**

```text
Design a high-fidelity MOBILE-FIRST (390x844) screen for **FixKart Store Partner**, the Indian plumbing/hardware store operations app. Use a premium practical B2B design: royal blue #1E4FD8, success green #1EA34A, amber #FF9F1C, danger red #E5484D, background #F5F6F8, white cards, near-black text #12141A, subtle borders #EAECEF, rounded 12–16px cards, clear Inter-like typography, restrained icons, accessible contrast, 8pt spacing, minimum 44px tap areas, prices formatted ₹, and realistic synthetic Indian hardware items. No stock photography clutter. Prioritize scannable operational information and clear CTAs. Design only the UI, not implementation code. Keep all actions consistent with FixKart's MVP: the **assigned plumber self-picks up materials from the store**; do not introduce rider assignment, delivery partner, courier tracking, OTP handover, or customer delivery workflows. Do not show fake banking settlement as completed. Include polished loading, empty, error, and disabled states where relevant.

SCREEN: Ready for Plumber Pickup. Create a celebratory but operational Ready for Pickup screen: success-green top hero with package icon, ‘Packed & Ready’ and ‘Awaiting assigned plumber’ subtitle. Below show order ID, status READY FOR PICKUP, quantity, total amount, assigned plumber identity (if supplied by API) and collection instructions. Prominent confirm action ‘Confirm Plumber Collected’ requiring a confirmation dialog that goods were physically handed over. Secondary ‘Print Invoice’ (visually available, note integration if necessary). Include loading/error/retry, confirmation success and Already Collected state. No rider/tracking or delivery OTP.
```


## 09 — Inventory List

**Navigation:** Main → Inventory  
**Current code:** Active but currently static demo UI  
**Purpose:** All/In Stock/Low Stock/Out of Stock filters, product cards and Add Product.

**Standalone Google Stitch prompt — copy and paste:**

```text
Design a high-fidelity MOBILE-FIRST (390x844) screen for **FixKart Store Partner**, the Indian plumbing/hardware store operations app. Use a premium practical B2B design: royal blue #1E4FD8, success green #1EA34A, amber #FF9F1C, danger red #E5484D, background #F5F6F8, white cards, near-black text #12141A, subtle borders #EAECEF, rounded 12–16px cards, clear Inter-like typography, restrained icons, accessible contrast, 8pt spacing, minimum 44px tap areas, prices formatted ₹, and realistic synthetic Indian hardware items. No stock photography clutter. Prioritize scannable operational information and clear CTAs. Design only the UI, not implementation code. Keep all actions consistent with FixKart's MVP: the **assigned plumber self-picks up materials from the store**; do not introduce rider assignment, delivery partner, courier tracking, OTP handover, or customer delivery workflows. Do not show fake banking settlement as completed. Include polished loading, empty, error, and disabled states where relevant.

SCREEN: Inventory List. Design a powerful inventory list for a hardware shop: header Inventory, search, filters; segmented tabs All / In Stock / Low Stock / Out of Stock, clear badge counts. Each row includes product thumbnail or simple fitting illustration, name, SKU/category, stock quantity, low-stock status and current selling price when known. Tap opens Product Details. Add a clearly labeled ‘Add Product’ floating CTA; include one thoughtful multi-select restock request action only as a design concept, not a fake integrated purchase. Five-tab nav with Inventory selected once. Provide distinct empty, loading and API failure states.
```


## 10 — Product Details

**Navigation:** Stack → ProductDetails  
**Current code:** Active but currently static demo UI  
**Purpose:** Product summary, SKU/specification, stock health, sales and stock update actions.

**Standalone Google Stitch prompt — copy and paste:**

```text
Design a high-fidelity MOBILE-FIRST (390x844) screen for **FixKart Store Partner**, the Indian plumbing/hardware store operations app. Use a premium practical B2B design: royal blue #1E4FD8, success green #1EA34A, amber #FF9F1C, danger red #E5484D, background #F5F6F8, white cards, near-black text #12141A, subtle borders #EAECEF, rounded 12–16px cards, clear Inter-like typography, restrained icons, accessible contrast, 8pt spacing, minimum 44px tap areas, prices formatted ₹, and realistic synthetic Indian hardware items. No stock photography clutter. Prioritize scannable operational information and clear CTAs. Design only the UI, not implementation code. Keep all actions consistent with FixKart's MVP: the **assigned plumber self-picks up materials from the store**; do not introduce rider assignment, delivery partner, courier tracking, OTP handover, or customer delivery workflows. Do not show fake banking settlement as completed. Include polished loading, empty, error, and disabled states where relevant.

SCREEN: Product Details. Design Product Details for ‘PVC Elbow 1/2 inch’ with a large product photo/illustration, SKU, category, brand, current selling price and MRP, current stock, stock health pill, reorder level and units sold last 30 days. Use a clean specification list with dividers and stock trend hint. Provide footer actions ‘View Sales’ and ‘Add Stock’, the latter opening a stock-adjustment sheet with current quantity, new quantity, reason and Save. Add Edit Product affordance but distinguish catalog-editing backend availability from real stock update. Clearly show low-stock conflict (do not simultaneously label same product ‘In Stock’ without nuance).
```


## 11 — Add / Edit Product

**Navigation:** Stack → AddProduct  
**Current code:** Active UI; catalog write is unsupported in staging  
**Purpose:** Product photos and input fields for name/category/brand/prices/stock.

**Standalone Google Stitch prompt — copy and paste:**

```text
Design a high-fidelity MOBILE-FIRST (390x844) screen for **FixKart Store Partner**, the Indian plumbing/hardware store operations app. Use a premium practical B2B design: royal blue #1E4FD8, success green #1EA34A, amber #FF9F1C, danger red #E5484D, background #F5F6F8, white cards, near-black text #12141A, subtle borders #EAECEF, rounded 12–16px cards, clear Inter-like typography, restrained icons, accessible contrast, 8pt spacing, minimum 44px tap areas, prices formatted ₹, and realistic synthetic Indian hardware items. No stock photography clutter. Prioritize scannable operational information and clear CTAs. Design only the UI, not implementation code. Keep all actions consistent with FixKart's MVP: the **assigned plumber self-picks up materials from the store**; do not introduce rider assignment, delivery partner, courier tracking, OTP handover, or customer delivery workflows. Do not show fake banking settlement as completed. Include polished loading, empty, error, and disabled states where relevant.

SCREEN: Add / Edit Product. Design a polished Add Product form, also usable as Edit Product by switching header and prefilled state. Top multiple image upload slots (camera/gallery), then labeled fields: Product Name*, Category*, Brand, Selling Price ₹*, MRP ₹, Stock Quantity*, Reorder Level*. Use two-column rows for related fields, numeric keyboards, validation for nonnegative stock and pricing, and a fixed ‘Save Product’ CTA. Show image-upload progress, dropdown selection states and success/error feedback. Important: catalog creation/update is not yet backed by a staging API; the mockup may design its future UX but mark Save disabled or ‘Integration pending’ in staging preview.
```


## 12 — Low Stock Alerts

**Navigation:** Stack → LowStockAlert  
**Current code:** Active but currently static demo UI  
**Purpose:** Stock shortage list, reorder threshold and per-item reorder action.

**Standalone Google Stitch prompt — copy and paste:**

```text
Design a high-fidelity MOBILE-FIRST (390x844) screen for **FixKart Store Partner**, the Indian plumbing/hardware store operations app. Use a premium practical B2B design: royal blue #1E4FD8, success green #1EA34A, amber #FF9F1C, danger red #E5484D, background #F5F6F8, white cards, near-black text #12141A, subtle borders #EAECEF, rounded 12–16px cards, clear Inter-like typography, restrained icons, accessible contrast, 8pt spacing, minimum 44px tap areas, prices formatted ₹, and realistic synthetic Indian hardware items. No stock photography clutter. Prioritize scannable operational information and clear CTAs. Design only the UI, not implementation code. Keep all actions consistent with FixKart's MVP: the **assigned plumber self-picks up materials from the store**; do not introduce rider assignment, delivery partner, courier tracking, OTP handover, or customer delivery workflows. Do not show fake banking settlement as completed. Include polished loading, empty, error, and disabled states where relevant.

SCREEN: Low Stock Alerts. Build an urgent-but-calm Low Stock Alerts screen showing a count banner, product cards with thumbnail, name, SKU/category, ‘Only X left’, reorder threshold and a simple red/amber stock indicator. Each row has outlined ‘Reorder’ action; distinguish ‘Request restock’ design from a successfully placed purchase order, because the current UI only simulates this action. Include sorting by severity, an empty healthy-stock state, and bottom ‘View All Inventory’ navigation. Back header and no permanent bottom tab when accessed as a detail screen.
```


## 13 — Material Requests Queue

**Navigation:** Main → Materials  
**Current code:** Active and API-backed  
**Purpose:** Real plumber material requests with All/Pending/Preparing/Ready/Completed filters.

**Standalone Google Stitch prompt — copy and paste:**

```text
Design a high-fidelity MOBILE-FIRST (390x844) screen for **FixKart Store Partner**, the Indian plumbing/hardware store operations app. Use a premium practical B2B design: royal blue #1E4FD8, success green #1EA34A, amber #FF9F1C, danger red #E5484D, background #F5F6F8, white cards, near-black text #12141A, subtle borders #EAECEF, rounded 12–16px cards, clear Inter-like typography, restrained icons, accessible contrast, 8pt spacing, minimum 44px tap areas, prices formatted ₹, and realistic synthetic Indian hardware items. No stock photography clutter. Prioritize scannable operational information and clear CTAs. Design only the UI, not implementation code. Keep all actions consistent with FixKart's MVP: the **assigned plumber self-picks up materials from the store**; do not introduce rider assignment, delivery partner, courier tracking, OTP handover, or customer delivery workflows. Do not show fake banking settlement as completed. Include polished loading, empty, error, and disabled states where relevant.

SCREEN: Material Requests Queue. Design the Store app’s most important operational queue, ‘Material Requests’. Fixed Materials tab active in five-tab navigation. Filter chips All / Pending / Preparing / Ready / Completed with true dynamic counts. Each tappable request card displays request ID, service order ID, requesting/assigned plumber, received date, number of SKUs, total ₹, and highly readable status. Show urgency without invented SLA metrics. Tap navigates to Material Request Detail. Include pull-to-refresh, Refresh action, skeleton loading, empty per-filter states, connection error with Retry and a partial-availability warning where backend supplies it. Do NOT provide a ‘Create Material Request’ button: requests originate from plumbers.
```


## 14 — Material Request Detail & Workflow

**Navigation:** Stack → MaterialRequestDetail  
**Current code:** Active and API-backed  
**Purpose:** Approve/reserve/prepare, mark ready and confirm plumber collection.

**Standalone Google Stitch prompt — copy and paste:**

```text
Design a high-fidelity MOBILE-FIRST (390x844) screen for **FixKart Store Partner**, the Indian plumbing/hardware store operations app. Use a premium practical B2B design: royal blue #1E4FD8, success green #1EA34A, amber #FF9F1C, danger red #E5484D, background #F5F6F8, white cards, near-black text #12141A, subtle borders #EAECEF, rounded 12–16px cards, clear Inter-like typography, restrained icons, accessible contrast, 8pt spacing, minimum 44px tap areas, prices formatted ₹, and realistic synthetic Indian hardware items. No stock photography clutter. Prioritize scannable operational information and clear CTAs. Design only the UI, not implementation code. Keep all actions consistent with FixKart's MVP: the **assigned plumber self-picks up materials from the store**; do not introduce rider assignment, delivery partner, courier tracking, OTP handover, or customer delivery workflows. Do not show fake banking settlement as completed. Include polished loading, empty, error, and disabled states where relevant.

SCREEN: Material Request Detail & Workflow. Design a detailed Material Request #84 page for the plumber-to-store workflow. Show request ID, linked service order, assigned plumber, store ID, request time, status pill, and requested-material item rows with product names, requested quantities, availability and ₹ total. Include a vertical progress timeline based on actual lifecycle REQUESTED/STORE_REVIEWING → APPROVED/RESERVED → PREPARING → READY_FOR_PICKUP → PLUMBER_AT_STORE → COLLECTED. Show **only the context-valid sticky CTA**: ‘Start Preparation’ from requested/review/approved, ‘Mark Ready for Pickup’ when preparing/reserved, ‘Confirm Plumber Collected’ when ready/at store, then green Completed banner. Provide disabled/loading/error/conflict states and confirmation before collection. No rider, courier or customer collection.
```


## 15 — Sales Analytics

**Navigation:** Stack → SalesAnalytics  
**Current code:** Active but currently static charts  
**Purpose:** Date range, total sales, order counts, trend bars and category breakdown.

**Standalone Google Stitch prompt — copy and paste:**

```text
Design a high-fidelity MOBILE-FIRST (390x844) screen for **FixKart Store Partner**, the Indian plumbing/hardware store operations app. Use a premium practical B2B design: royal blue #1E4FD8, success green #1EA34A, amber #FF9F1C, danger red #E5484D, background #F5F6F8, white cards, near-black text #12141A, subtle borders #EAECEF, rounded 12–16px cards, clear Inter-like typography, restrained icons, accessible contrast, 8pt spacing, minimum 44px tap areas, prices formatted ₹, and realistic synthetic Indian hardware items. No stock photography clutter. Prioritize scannable operational information and clear CTAs. Design only the UI, not implementation code. Keep all actions consistent with FixKart's MVP: the **assigned plumber self-picks up materials from the store**; do not introduce rider assignment, delivery partner, courier tracking, OTP handover, or customer delivery workflows. Do not show fake banking settlement as completed. Include polished loading, empty, error, and disabled states where relevant.

SCREEN: Sales Analytics. Create a data-heavy but easy-to-scan Sales Analytics screen. Header/back, date selector Today / This Week / This Month / Custom with clear date range. KPI cards Total Sales ₹, Number of Orders, optional Avg Order Value if API supports it, month-over-month delta only when data exists. Responsive 7-point sales bar/line chart with axis labels and accessible tooltips. Top Selling Categories horizontal bars with percentages (Plumbing, Electrical, Hardware, Other) when backed by data; empty-state otherwise. No hard-coded May 2025 analytics or arbitrary invented revenue masquerading as real. Clean white cards, compact labels.
```


## 16 — Wallet & Earnings

**Navigation:** Stack → Wallet  
**Current code:** Active but currently hardcoded financial demo  
**Purpose:** Balance, credits/debits, transaction list and withdraw placeholder.

**Standalone Google Stitch prompt — copy and paste:**

```text
Design a high-fidelity MOBILE-FIRST (390x844) screen for **FixKart Store Partner**, the Indian plumbing/hardware store operations app. Use a premium practical B2B design: royal blue #1E4FD8, success green #1EA34A, amber #FF9F1C, danger red #E5484D, background #F5F6F8, white cards, near-black text #12141A, subtle borders #EAECEF, rounded 12–16px cards, clear Inter-like typography, restrained icons, accessible contrast, 8pt spacing, minimum 44px tap areas, prices formatted ₹, and realistic synthetic Indian hardware items. No stock photography clutter. Prioritize scannable operational information and clear CTAs. Design only the UI, not implementation code. Keep all actions consistent with FixKart's MVP: the **assigned plumber self-picks up materials from the store**; do not introduce rider assignment, delivery partner, courier tracking, OTP handover, or customer delivery workflows. Do not show fake banking settlement as completed. Include polished loading, empty, error, and disabled states where relevant.

SCREEN: Wallet & Earnings. Design a trustworthy Store Wallet and Earnings page with a primary account-balance card, ‘Available for Payout’ amount, current month credit/debit summary and a dated transaction feed showing Order Payment, Payout, transaction ID and signed ₹ amounts. Distinguish available, pending and already-paid balances if data supports them. Show ‘Withdraw’ visually but disabled with explanatory ‘Payouts not active in staging’ state because ledger/bank disbursement is not production-ready. Provide transaction-filter/date range empty and loading states. Do not imply an actual bank transfer has happened from a mocked button.
```


## 17 — Reviews & Ratings

**Navigation:** Stack → ReviewsRatings  
**Current code:** Active and API-backed, with demo fallback labels  
**Purpose:** Overall rating, distribution bars, customer review cards.

**Standalone Google Stitch prompt — copy and paste:**

```text
Design a high-fidelity MOBILE-FIRST (390x844) screen for **FixKart Store Partner**, the Indian plumbing/hardware store operations app. Use a premium practical B2B design: royal blue #1E4FD8, success green #1EA34A, amber #FF9F1C, danger red #E5484D, background #F5F6F8, white cards, near-black text #12141A, subtle borders #EAECEF, rounded 12–16px cards, clear Inter-like typography, restrained icons, accessible contrast, 8pt spacing, minimum 44px tap areas, prices formatted ₹, and realistic synthetic Indian hardware items. No stock photography clutter. Prioritize scannable operational information and clear CTAs. Design only the UI, not implementation code. Keep all actions consistent with FixKart's MVP: the **assigned plumber self-picks up materials from the store**; do not introduce rider assignment, delivery partner, courier tracking, OTP handover, or customer delivery workflows. Do not show fake banking settlement as completed. Include polished loading, empty, error, and disabled states where relevant.

SCREEN: Reviews & Ratings. Design ‘Reviews & Ratings’ view with a clear overall star rating (one decimal), count of verified store reviews, 5-to-1 rating distribution bars, and scrollable customer review cards showing initials/avatar, rating stars, relative date, comments and service/order context only if available. Provide loading, network error, and true zero-review empty state. Never use fabricated 4.6 stars or ‘128 reviews’ as if real when the API returns none. Use a refined amber star accent with simple white surface cards and accessible typography.
```


## 18 — Offers & Promotions

**Navigation:** Stack → OffersPromotions  
**Current code:** Active route; staging feature currently disabled  
**Purpose:** Promotional offers, enabled-state toggle, create-offer modal (dev only).

**Standalone Google Stitch prompt — copy and paste:**

```text
Design a high-fidelity MOBILE-FIRST (390x844) screen for **FixKart Store Partner**, the Indian plumbing/hardware store operations app. Use a premium practical B2B design: royal blue #1E4FD8, success green #1EA34A, amber #FF9F1C, danger red #E5484D, background #F5F6F8, white cards, near-black text #12141A, subtle borders #EAECEF, rounded 12–16px cards, clear Inter-like typography, restrained icons, accessible contrast, 8pt spacing, minimum 44px tap areas, prices formatted ₹, and realistic synthetic Indian hardware items. No stock photography clutter. Prioritize scannable operational information and clear CTAs. Design only the UI, not implementation code. Keep all actions consistent with FixKart's MVP: the **assigned plumber self-picks up materials from the store**; do not introduce rider assignment, delivery partner, courier tracking, OTP handover, or customer delivery workflows. Do not show fake banking settlement as completed. Include polished loading, empty, error, and disabled states where relevant.

SCREEN: Offers & Promotions. Design an Offers & Promotions management screen with active, expired and upcoming offer list cards displaying coupon code, type (FLAT/PERCENT), value, minimum order, expiry, and enabled status. Include New Offer primary action opening a modal with code, description, discount type, value, min amount, expiry, and Save/Cancel. IMPORTANT: the existing staging API does not support offers; for staging state, show a tidy ‘Promotions unavailable until enabled’ notice and disable creation/toggles. Provide a separate clearly labeled visual future-enabled variant, not a fake successful promotion.
```


## 19 — Notifications Center

**Navigation:** Stack → Notifications  
**Current code:** Active and API-backed  
**Purpose:** Unread/read list, mark read/all read, deep links to relevant screens.

**Standalone Google Stitch prompt — copy and paste:**

```text
Design a high-fidelity MOBILE-FIRST (390x844) screen for **FixKart Store Partner**, the Indian plumbing/hardware store operations app. Use a premium practical B2B design: royal blue #1E4FD8, success green #1EA34A, amber #FF9F1C, danger red #E5484D, background #F5F6F8, white cards, near-black text #12141A, subtle borders #EAECEF, rounded 12–16px cards, clear Inter-like typography, restrained icons, accessible contrast, 8pt spacing, minimum 44px tap areas, prices formatted ₹, and realistic synthetic Indian hardware items. No stock photography clutter. Prioritize scannable operational information and clear CTAs. Design only the UI, not implementation code. Keep all actions consistent with FixKart's MVP: the **assigned plumber self-picks up materials from the store**; do not introduce rider assignment, delivery partner, courier tracking, OTP handover, or customer delivery workflows. Do not show fake banking settlement as completed. Include polished loading, empty, error, and disabled states where relevant.

SCREEN: Notifications Center. Design an efficient Notifications center with header/back, ‘Mark all read’ action shown only when there are unread messages, filters All / Unread and chronological notification cards. Distinct icons for New Order, Low Stock and Offer Activated, clear title/body/timestamp/unread marker, 44px tapping zones. Tapping marks an item read and navigates appropriately to Orders, Low Stock or Offers when supported. Include safe retry/loading/empty states (‘You’re all caught up’) without fake push notification features. Keep typography concise and visually distinguish actionable alerts.
```


## 20 — Store Profile / Business Details

**Navigation:** Stack → StoreProfile  
**Current code:** Active fetch; submenus mostly informational alerts  
**Purpose:** Store identity, ID, rating, business/bank/GST/docs/timings menus.

**Standalone Google Stitch prompt — copy and paste:**

```text
Design a high-fidelity MOBILE-FIRST (390x844) screen for **FixKart Store Partner**, the Indian plumbing/hardware store operations app. Use a premium practical B2B design: royal blue #1E4FD8, success green #1EA34A, amber #FF9F1C, danger red #E5484D, background #F5F6F8, white cards, near-black text #12141A, subtle borders #EAECEF, rounded 12–16px cards, clear Inter-like typography, restrained icons, accessible contrast, 8pt spacing, minimum 44px tap areas, prices formatted ₹, and realistic synthetic Indian hardware items. No stock photography clutter. Prioritize scannable operational information and clear CTAs. Design only the UI, not implementation code. Keep all actions consistent with FixKart's MVP: the **assigned plumber self-picks up materials from the store**; do not introduce rider assignment, delivery partner, courier tracking, OTP handover, or customer delivery workflows. Do not show fake banking settlement as completed. Include polished loading, empty, error, and disabled states where relevant.

SCREEN: Store Profile / Business Details. Design ‘Store Profile’ with store avatar/logo, official store name, unique Store ID, verified status only if known and real star rating only if supplied by API. Below, grouped details cards with rows for Store Details (name, address, contact), Business Information, Bank Details, GST Details, Verification Documents and Store Timings. Use masked sensitive banking values, secure disclosure and per-section ‘Not configured’ states when backend lacks data. Keep an Edit affordance only for supported fields; do not fabricate verification or bank-connected success. Include clear back to Account.
```


## 21 — Account & Settings

**Navigation:** Main → Account  
**Current code:** Active  
**Purpose:** User profile, settings/help/legal links and logout.

**Standalone Google Stitch prompt — copy and paste:**

```text
Design a high-fidelity MOBILE-FIRST (390x844) screen for **FixKart Store Partner**, the Indian plumbing/hardware store operations app. Use a premium practical B2B design: royal blue #1E4FD8, success green #1EA34A, amber #FF9F1C, danger red #E5484D, background #F5F6F8, white cards, near-black text #12141A, subtle borders #EAECEF, rounded 12–16px cards, clear Inter-like typography, restrained icons, accessible contrast, 8pt spacing, minimum 44px tap areas, prices formatted ₹, and realistic synthetic Indian hardware items. No stock photography clutter. Prioritize scannable operational information and clear CTAs. Design only the UI, not implementation code. Keep all actions consistent with FixKart's MVP: the **assigned plumber self-picks up materials from the store**; do not introduce rider assignment, delivery partner, courier tracking, OTP handover, or customer delivery workflows. Do not show fake banking settlement as completed. Include polished loading, empty, error, and disabled states where relevant.

SCREEN: Account & Settings. Design the main Account screen with top profile panel (store manager initials, name, email, Store account badge) and menu groups: Profile Settings, Material Requests, Notification Settings, App Language, Help & Support, Privacy Policy, Terms & Conditions. Rows feature compact icons, right chevrons and sensible labels. Place a clearly separated danger-accent ‘Log Out’ action at bottom with confirm dialog Cancel / Logout. Keep language, support and legal views as informational sheets until actual content endpoints exist. Fixed five-tab nav with Account selected once. Include missing-session and log-out loading states.
```

---

## Additional modal/state variations worth designing

1. Confirm Plumber Collection dialog (confirm/cancel, never silently auto-collect).
2. Short stock adjustment bottom sheet (quantity, reason, confirmation) for Product Details.
3. Order filters/search sheet, with mobile keyboard-safe results.
4. New Offer modal in disabled staging variant plus future-enabled variant.
5. Log Out confirmation dialog.
6. Standard loading skeleton, true empty state, network Retry state, and permission-denied state for key API-backed screens.

## Suggested Stitch workflow

Begin with screen 04 Home to establish components; then create tabs 05, 09, 13, 21; next create operational flow 13 → 14 → 08 and 05 → 06 → 07 → 08; finish authentication, inventory utilities and settings. Reuse the same five-tab navigation, buttons, cards, status chips, typography and icons in every screen. Label mock-only interactions as demos rather than real APIs.
