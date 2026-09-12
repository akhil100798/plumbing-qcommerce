# FixKart Design System Specification (Stitch MCP Source of Truth)

This document establishes the official design system specification for the **FixKart Quick-Commerce & On-Demand Plumbing Platform**, derived directly from the Stitch MCP design source of truth projects.

---

## 1. Design Philosophy & App Personalities

| Application | Primary Theme | Core Brand Tone | Primary Target User |
|---|---|---|---|
| **FixKart Customer App** | *Reliable Utility* | Approachable, High-Clarity, Fast | Homeowners & Residents seeking plumbing services & materials |
| **FixKart Plumber App** | *Field Ops Utility* | High-Contrast, Task-Oriented, Industrial | Field Technicians & Plumbers in fast-paced service environments |
| **FixKart Store App** | *Industrial & Efficient* | Information-Dense, Authoritative, High-Velocity | Store Managers & Warehouse Operators handling material requests |

---

## 2. Color System

### 2.1 Brand & App Primary Palettes

#### Customer App (*Reliable Utility*)
* **Primary Brand Blue (`#005BBF`)**: Navigation headers, active tabs, primary links.
* **Action Blue Container (`#1A73E8`)**: Primary call-to-action buttons.
* **Secondary Slate Navy (`#545F73`)**: Subheaders, secondary buttons.
* **Action Orange Accent (`#C55500` / `#9E4300`)**: Urgency badges, promotional highlights.

#### Plumber App (*Field Ops Utility*)
* **Primary System Blue (`#005BBF` / `#1A73E8`)**: Header bars, action icons.
* **Field Action Green (`#1B6D24` / `#217128`)**: Primary job flow actions ("Start Work", "Confirm Collection", "Verify OTP").
* **Warning Amber (`#865200` / `#A86800`)**: Blockers, pending material approvals, unconfirmed items.

#### Store Manager App (*Industrial & Efficient*)
* **Industrial Navy (`#1A237E`)**: App bar, global navigation, authoritative cards.
* **Attention Orange (`#FF6D00` / `#FD6C00`)**: High-priority request notifications, urgent fulfillment actions.
* **Status Semantic Palette**:
  * **Pending**: `#FD6C00` (Orange / Soft Container `#FFDBCB`)
  * **Accepted / In-Prep**: `#1A237E` (Navy / Soft Container `#E0E0FF`)
  * **Ready for Pickup**: `#1B6D24` (Green / Soft Container `#A0F399`)
  * **Completed**: `#454652` (Slate Grey / Soft Container `#E2E2E2`)

### 2.2 Shared Neutral & Surface Color Scale
* **Background (`surface`)**: `#F8F9FF` (Customer) / `#FAF9FD` (Plumber) / `#F9F9F9` (Store)
* **Card Surface (`surface_container_lowest`)**: `#FFFFFF`
* **Card Border (`outline_variant`)**: `#C1C6D6` / `#C6C5D4` / `#E2E8F0` (1px solid)
* **Text Primary (`on_surface`)**: `#0B1C30` / `#1A1B1E` / `#1A1C1C`
* **Text Secondary (`on_surface_variant`)**: `#414754` / `#454652`
* **Text Muted (`outline`)**: `#727785` / `#767683`

---

## 3. Typography Scale

The FixKart Design System uses **Manrope** for primary headers in consumer views and **Inter** for dense operational UI, body text, and numeric data across all apps.

| Token | Font Family | Size | Weight | Line Height | Tracking / Usage |
|---|---|---|---|---|---|
| `display-id` | Inter | 28px | 800 (ExtraBold) | 32px | `+0.05em` (Order IDs & OTPs) |
| `headline-xl` | Manrope / Inter | 32px | 700 (Bold) | 40px | `-0.02em` (Main Section Headers) |
| `headline-lg` | Manrope / Inter | 24px | 700 (Bold) | 32px | `-0.01em` (Screen Titles & Card Headers) |
| `headline-md` | Manrope / Inter | 20px | 600 (SemiBold) | 28px | Standard Subtitles & Item Names |
| `headline-sm` | Manrope / Inter | 18px | 600 (SemiBold) | 24px | Small Section Titles & Price Display |
| `body-lg` | Inter | 16px | 400 (Regular) | 24px | Primary Body & Description Text |
| `body-md` | Inter | 14px | 400 (Regular) | 20px | List Items & Secondary Descriptions |
| `body-sm` | Inter | 12px | 400 (Regular) | 16px | Captions & Timelines |
| `label-lg` | Inter | 14px | 600 (SemiBold) | 20px | `+0.01em` (Button Labels & Chips) |
| `label-sm` | Inter | 12px | 700 (Bold) | 16px | `+0.04em` (Status Badges & Caps) |

---

## 4. Spacing, Radius & Elevation Tokens

### 4.1 Spacing Scale (4px Baseline Grid)
* `xs`: 4px
* `sm`: 8px
* `md`: 12px
* `base`: 16px (Standard Screen Horizontal Margin)
* `lg`: 24px (Section Spacing)
* `xl`: 32px (Major Stack Spacing)
* **Touch Target Minimum**: 48px height across all interactive elements

### 4.2 Border Radius System
* `rounded-sm`: 4px (Tags, input checkboxes, status chips)
* `rounded-md`: 8px (Standard buttons, product cards, order cards, input fields)
* `rounded-lg`: 16px (Modal containers, top-level banners)
* `rounded-full`: 9999px (Pill badges, category filter chips, circular avatar icons)

### 4.3 Elevation & Shadows
* **Level 0 (Base Background)**: Flat background fill (`#F8F9FF` / `#F9F9F9`)
* **Level 1 (Cards)**: White surface with 1px border (`#E2E8F0` / `#C1C6D6`) and subtle blur shadow (`0px 2px 4px rgba(0,0,0,0.04)`)
* **Level 2 (Sticky Action Bar / Floating Cards)**: Elevated white surface with floating shadow (`0px 8px 16px rgba(0,0,0,0.10)`)

---

## 5. Component Patterns

### 5.1 Buttons
* **Primary Button**: Full-width (or auto-flex), height 52px-56px, 8px radius. Active background uses Brand Blue / Action Green, text `label-lg` white bold.
* **Secondary Button**: Outlined 1px solid border with matching text color, height 48px-52px, 8px radius.
* **Sticky Action Bar**: Fixed to bottom of viewport with safe area padding, container white with level 2 shadow.

### 5.2 Form Inputs
* **Outlined Field**: 1px solid `#727785` border, 8px radius, height 52px. Active state uses 2px Primary border.
* **Quantity Picker**: 48x48px `+` / `-` buttons flanking a central bold quantity counter.
* **OTP Input**: 6 distinct numeric boxes (or `display-id` style) with automatic focus transition.

### 5.3 Card Layouts
* **Order Card**: White background, 8px radius, 1px grey border. Displays Order ID in `display-id` / `label-lg`, status badge top-right, item summary, total price, and action buttons.
* **Product Card**: Vertical layout with image container, SKU in `body-sm`, name in `headline-sm`, price in bold INR, and "Add to Cart" / "Select" CTA.
* **Material Request Card**: Highlighted store name, list of requested items with quantities, approval status badge, and plumber / store action buttons.

---

## 6. App-Specific Workflow & UI Rules

### 6.1 Customer App Rules
* **No Delivery Rider Flow**: All service requests are plumber-handled. If materials are needed, the customer approves the plumber's material request directly in-app.
* **Real Backend Integration**: Uses `/api/v1/catalog`, `/api/v1/orders`, `/api/v1/auth`, `/api/v1/customers`.

### 6.2 Plumber App Rules
* **Direct Store Material Collection**: Plumber inspects job, selects nearby store, creates material request, waits for store readiness, collects directly from store, and resumes service work.
* **Job Stepper**: Visual vertical timeline tracking job state from `ACCEPTED` → `ARRIVED` → `IN_PROGRESS` → `COMPLETED`.

### 6.3 Store App Rules
* **High-Density Fulfillment Dashboard**: Optimized for store managers. Filters material requests by status (`PENDING`, `PREPARING`, `READY_FOR_PICKUP`, `COLLECTED`).
* **Direct Pickup Verification**: Store manager verifies plumber identity and updates material request state upon physical handover.
