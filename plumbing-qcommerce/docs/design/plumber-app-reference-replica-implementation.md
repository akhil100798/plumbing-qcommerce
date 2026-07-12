# Plumber App Exact Reference Replica Implementation Documentation

This document summarizes the exact UI replica implementation inside `plumber-app` matching the brand board design guidelines.

## 1. Reference Image & Visual Style
- **Visual Reference Board**: `/docs/evidence/phase-plumber-reference-replica/`
- **Branding**: FixKart
- **Slogan**: *Help. Fix. Earn. Repeat.*
- **Visual Elements**: White background, Rounded Cards, FixKart Blue (`#0B6BFF`), Success Green (`#20C45A`), Slate Neutrals, and Custom SVGs.

## 2. Screens Implemented & Polished
1. **Splash Screen** - Clean entry animation with `LogoMark` and `PlumberHero` sitting with toolbox, tagline, version, and "Partnering in progress..." indicator.
2. **Login Screen** - Tabs for Mobile and Email login, password forms, SVG social buttons, error checking, and loading overlay.
3. **OTP Verification** - 6-digit code entry boxes, countdown timer, resend handlers, and secure Shield verification badge.
4. **Dashboard / Home** - Greeting header, online availability toggle, earnings card, stats overview metrics, and quick actions grid.
5. **Incoming Job Request** - Acceptance details modal overlay, countdown timer, accept PATCH endpoint triggers.
6. **Active Job Screen** - Status timeline cards, job specifications summary, call/chat actions.
7. **Navigation Screen** - Map preview routing panel, turn instruction panels, REST arrival endpoints.
8. **Reached Customer** - Verified location badge card, arrived confirmation triggers.
9. **Start Work** - Checklists boxes, customer meta verification, work start triggers.
10. **Material Request** - Product catalog items selection, quantites stepper, requests submission.
11. **Material Approval Status** - Real-time approval checker, status banners, items invoice summaries.
12. **Material Tracking** - Delivery stages timelines path, rider card contact bindings.
13. **Before Photos Screen** - Work issue captures, upload selectors, staging transitions.
14. **After Photos Screen** - Repair completion captures, upload selectors, invoicing redirect triggers.
15. **Complete Service Screen** - Service and material sums, signature pad trigger, completion dispatch.
16. **Earnings Screen** - Periodic tabs earnings stats (Day, Week, Month), completed jobs lists.
17. **Wallet Screen** - Available balances, recent transaction histories, payout bank withdrawal alerts.
18. **Job History Screen** - Filters lists (All, Completed, Cancelled) of jobs.
19. **Profile Screen** - Technician name, ratings badges, shift availability toggle, help support links.
20. **Drawer / Menu Screen** - Slide panel listing all dashboard, wallet, settings, support, and logout rows.

## 3. SVG Assets Created (Separate Files)
- `plumber-dashboard-hero.svg`
- `reached-customer-illustration.svg`
- `material-tracking-illustration.svg`
- `profile-illustration.svg`
- `grow-more-banner.svg`
- `final-growth-banner.svg`
- `signature.svg`

## 4. Components Used
- `AppIcon`: Loads SVG functional components dynamically.
- `PrimaryButton`: Handles press animations, disable states, and loading activity indicators.
- `SecondaryButton`: Soft outline button variants.
- `EmptyStateCard`: Shown when job history or current catalog is empty.
- `RatingBadge`: Displays yellow stars alongside numerical count ratings.

## 5. Connected Staging Backend Endpoints
- **Authentication**: `POST /api/v1/auth/login`
- **Identity Profile**: `GET /api/v1/users/me`
- **Availability Toggle**: `PUT /api/v1/users/me/availability`
- **Job Accept**: `PATCH /api/v1/orders/{id}/accept`
- **Mark Arrival**: `PATCH /api/v1/orders/{id}/arrive`
- **Start Job**: `PATCH /api/v1/orders/{id}/start`
- **Complete Job**: `PATCH /api/v1/orders/{id}/complete?partsCharge=X`
- **Pending Orders Polling**: `GET /api/v1/orders/status/PENDING`
- **Material Status Check**: `GET /api/v1/delivery/{id}/status`

## 6. Known Limitations
* **Live GPS updates**: Mock coordinate maps are rendered because staging environment lacks native streaming telemetry.
* **Photo upload backend storage**: Selected files are captured locally on client side while API storage triggers placeholders.

## 7. No Inline SVG Confirmation
* Ripgrep has scanned the entire codebase; no inline `<svg>` or `<path>` tags exist inside code screen components. All vectors are clean, decoupled external SVG assets.
