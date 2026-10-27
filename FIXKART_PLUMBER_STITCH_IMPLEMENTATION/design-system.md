# FIXKART PLUMBER APP — EXACT DESIGN SYSTEM SPECIFICATION

This document details the standardized Stitch Design System tokens, typography, surfaces, geometries, and reusable UI components implemented inside `plumbing-qcommerce/plumber-app/`.

---

## 1. Color Palette Tokens (`src/theme/colors.ts`)

| Token Name | Hex Code | Purpose & Application |
|------------|----------|-----------------------|
| `stitchNavy` | `#0A1E4A` | Primary header surface, curved top hero banners, brand badges, dark hero backgrounds |
| `stitchBlue` | `#003BB8` | Deep cobalt brand color, primary CTAs, active tab icons, highlighted progress steps |
| `stitchAction` | `#1A56DB` | Interactive buttons, navigation directions, turn-by-turn guidance prompts |
| `stitchGreen` | `#10B981` | Online toggle active track, success badges, approval confirmation cards, verified status |
| `stitchEmerald`| `#059669` | High-contrast green actions, material approval buttons, cash earnings indicators |
| `stitchDark` | `#111827` | Primary typography, bold headings, customer names, job titles, monetary balances |
| `stitchMuted` | `#6B7280` | Secondary typography, timestamps, address labels, subtitle hints, inactive tab icons |
| `stitchLight` | `#F8FAFC` | App-wide screen background surface, input fields, off-white card backgrounds |
| `stitchBorder`| `#E2E8F0` | Subtle hairline dividers, card borders, tab bar borders, input outlines |
| `stitchCard` | `#FFFFFF` | Crisp white elevated cards, modal sheets, floating dock panels, bottom nav background |
| `stitchWarning`| `#F59E0B` | Pending status chips, timer progress rings, urgent customer notes |
| `stitchDanger` | `#EF4444` | Decline job buttons, cancel order actions, logout confirmation, validation error states |

---

## 2. Typography System

The exported Google Stitch designs utilize **Manrope** for primary numerical values, metric cards, and screen titles, alongside **Hanken Grotesk** for clean, readable microcopy, forms, and instructional content.

### Hierarchy Scale

- **Display / Metric (28px - 32px, Bold 800):** Earnings figures (e.g. `₹4,250`), wallet balances, big timers.
- **Title 1 / Screen Header (22px - 24px, Bold 700):** Top navigation titles ("Incoming Request", "Material Tracking", "Profile").
- **Title 2 / Section Header (17px - 18px, Semi-Bold 600):** Card headers ("Customer Details", "Bill of Materials", "Recent Trips").
- **Body 1 / Form Input & Labels (14px - 15px, Medium 500):** Interactive text fields, customer addresses, phone inputs.
- **Body 2 / Secondary Text (13px - 14px, Regular 400):** Subtext, timestamps, distance indicators ("2.4 km away").
- **Caption / Status Badges (11px - 12px, Semi-Bold 600):** Chip labels ("READY FOR PICKUP", "VERIFIED", "ONLINE").

---

## 3. Elevation, Radii & Layout Tokens

- **Border Radii:**
  - `sm: 6px` — Tiny indicators, notification pills.
  - `md: 10px` — Button corners, standard text inputs, OTP digit boxes.
  - `lg: 16px` — Standard elevated cards, job cards, earnings summary cards.
  - `xl: 24px - 28px` — Bottom sheets, curved header bottoms, arrival radar sheets.
  - `full: 9999px` — Circular avatars, round icon buttons, toggle pills.

- **Elevations & Drop Shadows:**
  - `elevation-1`: Subtle card depth (`shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2`).
  - `elevation-2`: Floating bottom dock and headers (`shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5`).
  - `elevation-3`: Modal bottom sheets and accept/decline panels (`shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 10`).

---

## 4. Reusable Core Component Inventory

1. **`AppHeader` (`src/components/common/AppHeader.tsx`):**
   - High-contrast Stitch navy curved header with back navigation, screen title, and optional contextual icon/badge.
2. **`PlumberAvatar` (`src/components/common/PlumberAvatar.tsx`):**
   - Circular plumber profile picture with border ring, online green beacon, and fallback initials or mascot.
3. **`StatusBadge` (`src/components/common/StatusBadge.tsx`):**
   - Pill badge supporting variants: `success` (green), `warning` (amber), `info` (blue), `neutral` (gray), `danger` (red).
4. **`JobProgressTimeline` (`src/components/common/JobProgressTimeline.tsx`):**
   - 5-step horizontal or vertical stepper indicating: Assigned -> Arrived -> Diagnosed -> Materials -> Completed.
5. **`RouteMap` (`src/components/common/RouteMap.tsx`):**
   - Scalable map canvas with pickup, destination pins, plumber live coordinate marker, and polyline preview.
6. **`PhotoUploadGrid` (`src/components/common/PhotoUploadGrid.tsx`):**
   - 2x2 photo slot grid with dashed borders, camera trigger, preview thumbnails, and deletion triggers.
7. **`BottomNavigation` (`src/navigation/MainTabNavigator.tsx`):**
   - 4-tab docked bar: Jobs, Materials, Earnings, Profile with custom vector SVG icons and active blue indicator.
8. **`DrawerMenu` (`src/screens/profile/DrawerMenuScreen.tsx`):**
   - Slide-over plumber drawer with availability switch, quick navigation links, version tag, and sign out CTA.
