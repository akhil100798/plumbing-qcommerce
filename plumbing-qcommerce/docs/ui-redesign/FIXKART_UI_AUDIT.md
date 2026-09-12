# FIXKART UI/UX REDESIGN AUDIT

## Project Analysis — Phase 1 Complete

---

## OVERVIEW

Four applications sharing backend APIs but built with **no shared design system**:

| App | Platform | Framework | Theme | State Mgmt | Routes |
|-----|----------|-----------|-------|-----------|--------|
| customer-app | Expo 51 / React Native | Modular context | Material 3-inspired | React Context | 15 screens |
| plumber-app | Expo 55 / React Native | Stack + Tab nav | Custom tokens | Redux Toolkit | 25 screens |
| store-app | Expo 55 / React Native | Stack + Tab nav | Custom + buggy | Redux (minimal) | 25 screens |
| admin-portal | Next.js 16 / Web | App Router | Dark theme CSS | React Context | 48 pages |

---

## CUSTOMER APP AUDIT

### Screens & Routes

| # | Screen | Route | Purpose | Primary Action | API Deps |
|---|--------|-------|---------|---------------|----------|
| 1 | SplashScreen | splash | Auth gate + brand intro | Auto-navigate | auth check |
| 2 | LoginScreen | login | Phone number entry | Send OTP | auth/login |
| 3 | OtpScreen | otp | Verify 6-digit code | Verify & proceed | auth/verify-otp |
| 4 | HomeScreen | home | Catalog discover + active order banner | Browse & book | catalog/categories, products |
| 5 | SearchScreen | search | Search/filter services + products | Find & select | catalog/search |
| 6 | ServiceDetailScreen | service_detail | Service info, slots, add to cart | Book service | catalog/services |
| 7 | ProductDetailScreen | product_detail | Product info, specs, add to cart | Add to cart | catalog/products |
| 8 | CartScreen | cart | Items review, coupon, bill | Checkout | (local state) |
| 9 | CheckoutScreen | checkout | Address, slot, payment, place order | Place order | orders/create |
| 10 | PaymentSuccessScreen | payment_success | Confirmation, track | Track or home | (none) |
| 11 | OrdersScreen | orders | Booking list (ongoing/history) | View booking | orders/customer |
| 12 | OrderTrackingScreen | order_tracking | Live map, plumber, timeline, materials, rating | Track, confirm, rate | orders/{id}, materials |
| 13 | ProfileScreen | profile | User info, menu, logout | Navigate menu | (profile data) |
| 14 | SavedAddressesScreen | saved_addresses | Address CRUD | Add/edit/delete address | address CRUD |
| 15 | SupportChatScreen | support_chat | Bot chat with quick replies | Get help | (local mock) |

### Current UI Problems

- **Header patterns**: Every screen duplicates header back button + title pattern (~20 lines each)
- **Bottom bar**: Filled pill badge with error color (over-emphasizes cart count)
- **StatusChip**: Hardcoded HEX colors instead of theme tokens
- **ServiceCard/ProductCard**: Duplicated shadow/border patterns; inconsistent "ADD" vs "ADDED" language
- **QuantitySelector**: Uses `–` character that may not be universally rendered
- **Spacing inconsistency**: `paddingHorizontal: spacing.lg` varies — some use 16, some 20
- **No shared ScreenContainer**: Each screen sets its own `flex: 1, backgroundColor: colors.background`
- **No LoadingSkeleton**: Only full-screen spinners
- **Empty states**: Inconsistent — some use SVG icons, some use emoji
- **Error states**: Catch + console.warn but no user-facing error UI
- **Form validation**: Only Alert-based, no inline field error display

---

## PLUMBER APP AUDIT

### Screens & Routes (25 screens)

| # | Screen | Route | Primary Action | Key Issues |
|---|--------|-------|---------------|-----------|
| 1 | SplashScreen | Splash | Auth check | Hardcoded `36px` font |
| 2 | LoginScreen | Login | Sign in | Demo creds hardcoded, unused SVG imports |
| 3 | OtpScreen | Otp | Verify | `borderRadius: 32` no token |
| 4 | RegisterScreen | Register | Register | **NO theme tokens used** — all hardcoded |
| 5 | DashboardScreen | Dashboard | View metrics | Fallback `|| '#...'` patterns, inline emoji |
| 6 | JobsScreen | Jobs | Job list | **Minified single line** — unmaintainable |
| 7 | IncomingJobRequestScreen | IncomingJobRequest | Accept/reject | Hardcoded `#0F172A`, `#10B981`, mock data |
| 8 | ActiveJobScreen | ActiveJob | Manage job | Hardcoded `#10B981`, `#DBEAFE` |
| 9 | NavigationScreen | Navigation | Arrive at customer | Hardcoded `#FEE2E2`, `#EF4444` |
| 10 | ReachedCustomerScreen | ReachedCustomer | Confirm arrival | `180x180` hardcoded, `borderRadius: 90` |
| 11 | StartWorkScreen | StartWork | Start/materials | `flex: 1.2`, two button paradigms |
| 12 | MaterialsScreen | Materials | View requests | **Broken nav** — navigates to self |
| 13 | StoreSelectionScreen | StoreSelection | Pick store | Custom radio `20x20`, no PrimaryButton |
| 14 | MaterialRequestScreen | MaterialRequest | Select + submit | Footer `borderRadius: 20` not token |
| 15 | MaterialApprovalStatusScreen | MaterialApprovalStatus | Track | **Always "Approved"** — never real state |
| 16 | MaterialTrackingScreen | MaterialTracking | Track + collect | Hardcoded `#FFFBEB`, `#FDE68A` |
| 17 | BeforePhotosScreen | BeforePhotos | Capture "before" | Duplicate of AfterPhotos |
| 18 | AfterPhotosScreen | AfterPhotos | Capture "after" | Duplicate of BeforePhotos |
| 19 | CompleteServiceScreen | CompleteService | Complete | Fallback patterns, 3 states in one file |
| 20 | EarningsScreen | Earnings | View earnings | **Minified single line** |
| 21 | WalletScreen | Wallet | Withdraw | Mock fallback data, emoji icons |
| 22 | JobHistoryScreen | JobHistory | History list | Missing `onPress`, raw `apiClient` |
| 23 | ProfileScreen | Profile | Profile + KYC | **No shared components used**, emoji menus |
| 24 | DrawerMenuScreen | DrawerMenu | Menu nav | Hardly any theme tokens |
| 25 | ChatScreen | Chat | Message | Mock only, no socket |

### Plumber App Critical Issues

- **20+ common components exist but most are unused**: `StatusChip`, `StarRating`, `FeedbackStates`, `EmptyStateCard`, `LoadingSkeletonCard`, 6 Animated* variants, `BarChart`, `IconBadge`, `IconButton`
- **3 button patterns**: `PrimaryButton`, `SecondaryButton`, `Button` — yet screens use raw `TouchableOpacity`
- **Status badges**: 8+ unique hardcoded implementations vs `StatusChip` available but unused
- **Theme has `spacing.layout: 18`** — not a multiple of 4 or 8, causes alignment issues
- **`colors.surface` and `colors.background` both `#FAF9FD`** — no distinction
- **No `zIndex`, `opacity` tokens**
- **Hardcoded green `#10B981`** used in screens instead of theme colors

---

## STORE APP AUDIT

### Screens & Routes (25 screens)

| # | Screen | Route | Primary Action | Key Issues |
|---|--------|-------|---------------|-----------|
| 1 | SplashScreen | Splash | Auth check | No error fallback |
| 2 | LoginScreenNew | Login | Sign in | Navigates bypassing tab navigator |
| 3 | LoginScreen (legacy) | — | Old login | **Exists alongside LoginScreenNew** |
| 4 | RegisterScreen | Register | Register | `borderRadius: 10` not token, any types |
| 5 | DashboardScreen | Dashboard | Metrics view | 4-tile `width: '23%'`, duplicates |
| 6 | InventoryScreen | Inventory | Stock list | Inline product card duplicates `ProductCard` |
| 7 | ProductDetailsScreen | ProductDetails | Update stock | **No PrimaryButton used** — raw TouchableOpacity |
| 8 | AddProductScreen | AddProduct | Add to inventory | Duplicate radio pattern, no image preview |
| 9 | LowStockAlertScreen | LowStockAlert | Reorder | **100% hardcoded mock**, no API |
| 10 | MaterialRequestsScreen | MaterialRequests | Fulfillment queue | Chip tabs vs underline tabs inconsistency |
| 11 | MaterialRequestDetailScreen | MaterialRequestDetail | Accept/reject/prepare | **No shared button components** |
| 12 | PackingScreen | Packing | Pack items | **`colors.secondary` used for green** — ORANGE bug |
| 13 | ReadyForPickupScreen | ReadyForPickup | Confirmation | **Same green/orange semantic bug** |
| 14 | CollectionConfirmationScreen | CollectionConfirmation | Handover | Same color bug, no auto-dismiss |
| 15 | OrdersScreen | Orders | (placeholder) | Deferred feature — duplicates pattern |
| 16 | OrderDetailsScreen | OrderDetails | View order | **100% hardcoded mock data** |
| 17 | AccountScreen | Account | Profile menu | Duplicates `ProfileMenuItem` inline |
| 18 | StoreProfileScreen | StoreProfile | Edit profile | Save button duplicates PrimaryButton |
| 19 | NotificationsScreen | Notifications | Notification feed | Duplicates `NotificationCard` inline |
| 20 | SalesAnalyticsScreen | SalesAnalytics | Metrics | Charts unused, PDF export broken on RN |
| 21 | WeeklySummaryScreen | WeeklySummary | KPI grid | `width: '47%'`, duplicates metric cards |
| 22 | ReviewsRatingsScreenNew | ReviewsRatings | Reviews | Good — uses shared `ReviewCard` |
| 23 | WalletScreen | Wallet | (placeholder) | Feature-disabled |
| 24 | OffersPromotionsScreen | OffersPromotions | (placeholder) | Feature-disabled |
| 25 | DispatchAssignmentScreen | DispatchAssignment | (placeholder) | Feature-disabled |

### Store App Critical Issues

- **CRITICAL**: `colors.secondary` is `#FD6C00` (orange). `colors.success` is `#1B6D24` (green). **Every "green" success screen uses `colors.secondary || '#1B6D24'` which resolves to ORANGE because `secondary` is truthy.** This is a THEME CONFIGURATION BUG affecting all order flow screens.
- **`colors.warning` and `colors.secondary` are BOTH `#FD6C00`** — identical value, semantic confusion
- **18 shared components exist but almost none are used** in actual screens
- **Every screen duplicates the "white card with border" layout** (should be a shared Card component)
- **`PrimaryButton` used only in 3 files** out of 25 screens

---

## ADMIN PORTAL AUDIT

### Pages & Routes (48 pages)

| Section | Pages | Primary Action | Issues |
|---------|-------|---------------|--------|
| Super Admin | Dashboard, Users, Admins, Roles, System Health | View KPIs, manage users | Window.confirm for actions |
| Operations | Dashboard, Orders, Service Jobs, Material Requests, Pickups, Partners, Delayed, Reassignments | Operational oversight | No modal components |
| Finance | Dashboard, Payments, Settlements, Payouts, Refunds, Commission | Financial management | Missing loading states |
| Support | Dashboard, Tickets, Escalations, Create Ticket, User Context | Ticket management | Input misuse for textarea |
| Plumber Manager | Dashboard, Plumbers, KYC, Performance, Earnings | Workforce management | Well-structured |
| Marketing | Dashboard, Offers, Campaigns, Banners, Notifications, Segments, Reports | Campaign management | Segments page minimal |

### Admin Portal Issues

- **Duplicate CSS systems**: Legacy `.badge-*`/`.btn-*` (lines 116-270) AND new `.badge-*`/`.button-*` (lines 730-915) both active
- **6 unused chart/components**: `TopProductsChart`, `OrdersTrendChart`, `KpiCard`, `DynamicPricingPanel`, `DemandForecastPanel`, `BundleSuggestionsPanel` not imported anywhere
- **`currency()` helper defined 5+ times**: In operations, finance, support, plumber-manager helpers plus inline in material-pickups
- **`statusTone()/tone()` defined 5 times**: Different mapping rules in each section
- **`window.confirm()` and `window.prompt()`** used in 6+ pages instead of modals
- **No design token JS/TS module**: Tokens only exist in `:root` CSS variables
- **Tailwind v4 installed but completely unused**
- **No `aria-*` attributes, no focus management, no keyboard nav optimization**
- **No state management**: Every page uses useState/useEffect; session via React Context only

---

## CROSS-CUTTING PROBLEMS

### Duplicate Components / Logic
- **Button component**: 3 variants across plumber app; 2 in store app; raw `TouchableOpacity` in most screens
- **Status color mapping**: 5+ duplicate `tone()`/`statusTone()` maps across admin; 3+ `statusDisplay` maps across store
- **Helper functions**: `currency()` redefined 5+ times; `formatDate()` redefined 4+ times
- **Card patterns**: Every screen inlines its own "white card with border" (~20 lines each)
- **Loading/error/empty states**: Every screen implements its own

### Inconsistent Design Tokens
- `spacing.layout: 18` (not a multiple of 4/8) — exists in plumber/store but not customer
- `colors.secondary` = orange in store, green in plumber — **same token, different semantics**
- 3+ different `colors.successLight` values across apps
- No shared `opacity` tokens (`.3`, `.5`, `.8` hardcoded)
- No shared `color.disabled` token

### Accessibility
- No `aria-*` attributes in admin portal
- Emoji used as icons (support chat, profile menus) — screen reader unfriendly
- Touch targets: Back buttons are `36x36` (borderline for 44px min)
- No focus-visible styles in admin
- No reduce-motion support

### Performance Concerns
- `lucide-react-native` tree-shake not guaranteed
- Redux loaded in plumber/store but minimally used
- 5-second polling intervals hardcoded in tracking screens (no config)
- Recharts unused in admin but bundled

---

## PHASE 1 COMPLETE

### Screens audited:
- Customer: 15 screens
- Plumber: 25 screens
- Store: 25 screens
- Admin: 48 pages

### Shared UI problems:
1. No unified design system across 4 apps
2. Status color mapping duplicated 8+ times and inconsistent
3. Button components exist but screens use raw TouchableOpacity
4. Card layouts duplicated in every screen
5. Loading/empty/error states custom per screen
6. Emoji used as icons (accessibility failure)
7. window.confirm/prompt in admin (no modal system)
8. Hardcoded colors/magic numbers throughout
9. No shared ScreenContainer wrapper
10. Helper functions (currency, formatDate, statusTone) duplicated 5+ times

### Design-system problems:
1. Three different token sets across apps (customer uses MD3, plumber/store use custom, admin uses CSS vars)
2. `colors.secondary` means different things across apps
3. No shared spacing scale — `spacing.layout: 18` is an outlier
4. No opacity tokens, no z-index tokens
5. No motion/animation tokens beyond basic duration
6. Font families differ: Manrope+Inter (customer) vs System (plumber/store/admin)
7. No responsive breakpoint tokens
8. No shadow tokens in customer app

### Recommended redesign order:
1. Create ONE FixKart design system (shared tokens)
2. Redesign Customer app first (establishes language)
3. Redesign Plumber app second (operational)
4. Redesign Store app third (information density)
5. Redesign Admin portal last (desktop pattern)