# FIXKART DESIGN SYSTEM

## ONE shared visual language for all 4 apps.

---

## DESIGN PHILOSOPHY

- **Modern** — Clean, minimal, generous whitespace
- **Professional** — Trustworthy blue primary, sharp typography
- **Friendly** — Warm accents, approachable cards, human spacing
- **Fast** — Instant feedback, subtle motion, no decorative bloat
- **Service-oriented** — Information hierarchy prioritizes: What → Who → When → How
- **Mobile-first** — Every component designed for touch, scales up

---

## TYPOGRAPHY

### Font Family
- **Headings & UI**: `Manrope` (clean, geometric sans-serif, premium feel)
- **Body & Labels**: `Inter` (highly legible at small sizes, great for data)
- **Monospace**: `JetBrains Mono` (for order IDs, codes — used sparingly)

### Scale

| Token | Name | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|------|--------|-------------|----------------|-------|
| `display` | Display | 32px | 700 | 38px | -0.75 | Hero numbers, empty state title |
| `h1` | Page Title | 26px | 700 | 32px | -0.5 | Screen titles, success screen |
| `h2` | Section Title | 22px | 700 | 28px | -0.3 | Major section headers |
| `h3` | Card Title | 18px | 600 | 24px | 0 | Card titles, modal titles |
| `h4` | Item Title | 16px | 600 | 22px | 0 | List item titles, article headers |
| `body` | Body | 15px | 400 | 22px | 0 | Paragraph text, descriptions |
| `body2` | Secondary Body | 14px | 400 | 20px | 0 | Secondary description text |
| `caption` | Caption | 12px | 400 | 16px | 0 | Labels, timestamps, metadata |
| `label` | Label | 11px | 700 | 14px | 0.5 | Badges, uppercase labels, status |
| `button` | Button Text | 15px | 600 | 20px | 0.3 | Button labels |
| `data` | Data / Number | 14px | 700 | 18px | 0 | Prices, counts, metrics |

### Implementation
- All 4 apps use the token names above (`theme.typography.h1`, etc.)
- Admin portal uses same scale but applies via CSS class tokens

---

## SPACING SCALE

### Base: 4px grid

| Token | px | rem | Usage |
|-------|----|-----|-------|
| `xxs` | 2 | 0.125 | Micro spacing (icons inside badges) |
| `xs` | 4 | 0.25 | Smallest gap, icon-to-text spacing |
| `sm` | 8 | 0.5 | Input padding, element gaps |
| `md` | 12 | 0.75 | Card padding horizontal, form gaps |
| `lg` | 16 | 1 | Standard card padding, section gap |
| `xl` | 20 | 1.25 | Screen horizontal padding, large gaps |
| `xxl` | 24 | 1.5 | Between sections, modal padding |
| `xxxl` | 32 | 2 | Major section separation |
| `section` | 40 | 2.5 | Between feature blocks on home |
| `page` | 48 | 3 | Top/bottom page padding |

### Screen horizontal padding
- Mobile: `spacing.xl` (20px) — **must be consistent across all mobile screens**
- Tablet: `spacing.xxl` (24px)  
- Desktop: `spacing.xxxl` (32px)

### Vertical rhythm
- Between cards in a list: `spacing.md` (12px)
- Between sections: `spacing.xxl` (24px)
- Between items in a list: `spacing.sm` (8px)

---

## RADIUS

| Token | Value | Usage |
|-------|-------|-------|
| `none` | 0 | Full-bleed elements |
| `xs` | 4 | Badges, small indicators |
| `sm` | 8 | Input fields, small chips |
| `md` | 12 | Standard card radius |
| `lg` | 16 | Large cards, modals |
| `xl` | 22 | Bottom sheets, dialogs |
| `xxl` | 28 | Hero banners, special containers |
| `full` | 9999 | Avatars, pills, rounded buttons |

---

## ELEVATION

| Token | iOS Shadow | Android Elevation | Usage |
|-------|-----------|-------------------|-------|
| `none` | — | 0 | Default |
| `sm` | y:1, opacity:0.06, radius:4 | 2 | Cards, buttons |
| `md` | y:3, opacity:0.1, radius:8 | 4 | Raised cards, bottom bars |
| `lg` | y:6, opacity:0.14, radius:16 | 8 | Modals, bottom sheets |
| `xl` | y:10, opacity:0.2, radius:24 | 12 | Top-level overlays |

Shadow color: `rgba(11, 28, 48, <opacity>)` across all apps.

---

## COLORS

### Unified FixKart Palette

```
Primary:        #0066CC (Trustworthy blue)
Primary Dim:    #004DB5 (Hover, dark variant)
Primary Light:  #E8F0FE (Container backgrounds)
On Primary:     #FFFFFF

Secondary:      #42526E (Muted navy, operational UI)
On Secondary:   #FFFFFF

Background:     #F8F9FF (Very light blue-gray)
On Background:  #0B1C30

Surface:        #FFFFFF
On Surface:     #0B1C30
Surface Variant: #E1E2EC
On Surface Var: #414754
Surface Dim:    #F3F3F8

Outline:        #727785
Outline Light:  #C1C6D6
Divider:        #E1E2EC

Success:        #0D7A3E (Green)
Success Light:  #E6F7EC
On Success:     #0D652D

Warning:        #F59E0B (Amber)
Warning Light:  #FEF3C7
On Warning:     #92400E

Error:          #BA1A1A (Red)
Error Light:    #FFDAD6
On Error:       #93000A

Info:           #0284C7 (Sky Blue)
Info Light:     #E0F2FE
On Info:        #0369A1

Star:           #F59E0B (Same as warning — intentional, for ratings)
Overlay:        rgba(11, 28, 48, 0.5)
Backdrop:       rgba(0, 0, 0, 0.4)
```

### Status → Color Mapping (ALL apps use this single source of truth)

| Status Group | Color Token | Text Token | Background |
|-------------|-------------|-----------|------------|
| Requested / PENDING | `colors.warning` | `colors.onWarning` | `colors.warningLight` |
| Accepted / APPROVED | `colors.primary` | `colors.onPrimary` | `colors.primaryLight` |
| In Progress / PREPARING | `colors.info` | `colors.onInfo` | `colors.infoLight` |
| Completed / DELIVERED | `colors.success` | `colors.onSuccess` | `colors.successLight` |
| Cancelled / REJECTED | `colors.error` | `colors.onError` | `colors.errorLight` |
| Assigned / CONFIRMED | `colors.primary` | `colors.onPrimary` | `colors.primaryLight` |
| Materials Needed | `colors.warning` | `colors.onWarning` | `colors.warningLight` |
| Ready for Pickup | `colors.success` | `colors.onSuccess` | `colors.successLight` |

---

## ICON SYSTEM

- Primary icon library: **lucide-react-native** (customer app) and custom SVGs
- Size tokens: 16 (inline), 20 (small icon), 24 (standard), 32 (large), 48 (illustration)
- Use SVG icons over emoji everywhere
- Stroke width: 1.5px for standard icons, 2px for bold/navigation icons
- Color: `colors.onSurface` (default), `colors.primary` (active), `colors.secondary` (inactive)

---

## INPUT & BUTTON SIZES

| Component | Height | Radius | Padding H |
|-----------|--------|--------|-----------|
| Primary / Secondary Button | 52px | 12px | 24px |
| Small Button | 36px | 8px | 16px |
| Text Input | 50px | 10px | 14px |
| Search Bar | 46px | 14px | 14px |
| Chip / Tag | 32px | 8px | 12px |
| Status Pill | 24px | 6px | 10px |
| Icon Button | 38px | 19px | — |
| Bottom Tab Item | — | — | 6px vertical |

---

## CONTAINER WIDTHS

- Mobile content: 100% (max 480px for readability)
- Tablet: 768px max
- Desktop: 1200px max
- Admin sidebar: 280px
- Admin content: calc(100% - 280px)

---

## RESPONSIVE BREAKPOINTS

| Breakpoint | Width | Device |
|-----------|-------|--------|
| `phone` | < 480px | Mobile phones |
| `phablet` | 480 - 767px | Large phones |
| `tablet` | 768 - 1023px | iPads / tablets |
| `desktop` | 1024 - 1439px | Laptops |
| `wide` | ≥ 1440px | Desktops |

---

## LOADING / EMPTY / ERROR STATES

### Loading
- **Skeleton shimmer** for content-heavy views (cards, lists, product grids)
- **Subtle pulsing** for small inline elements
- **Spinner** ONLY for full-screen blocking operations (login, payment processing)
- Skeleton colors: `colors.surfaceVariant` with shimmer highlight

### Empty
- Illustration + Title (h3) + Description (body2) + Optional CTA (primary button)
- Use consistent illustration style across all apps
- Empty titles: Positive framing ("No active bookings yet" not "No bookings")

### Error
- Error icon + Title "Something went wrong" + Description + Retry button
- Never expose stack traces or raw JSON
- Auto-retry only for WebSocket/polling failures
- Manual retry for user-initiated actions

---

## MOTION & INTERACTION (Phase 3)

Durations and easings used consistently:

| Interaction | Duration | Easing | Property |
|------------|----------|--------|----------|
| Button press | 100ms | ease-out | scale → 0.97 |
| Card press | 120ms | ease-out | opacity → 0.85 |
| Screen push | 280ms | ease-in-out | translateX + opacity |
| Modal appear | 250ms | ease-out | scale(0.95→1) + fade |
| Bottom sheet | 300ms | ease-out | translateY |
| Tab switch | 180ms | ease-out | opacity + slight translate |
| Status change | 200ms | ease-out | backgroundColor + scale pulse |
| Success flash | 240ms | ease-out | scale pulse + fade |
| Skeleton shimmer | 1200ms | linear (loop) | translateX |

### Animation Types
- **Micro**: Press feedback, toggle, status change (100-180ms)
- **Normal**: Cards, lists, buttons, loading (180-280ms)
- **Transition**: Screen changes, modals, sheets (250-350ms)
- **Decorative**: Skeleton shimmer, progress (800-1200ms, looped)

### Reduced Motion
- When `prefers-reduced-motion` is set:
  - Disable all decorative animations (shimmer, banners)
  - Keep micro feedback (press, status change) at 60ms
  - Keep screen transitions at 150ms with opacity only (no translate)
  - Keep loading spinners (essential feedback)

---

## COMPONENT SYSTEM

### Shared Components (must exist in one place, used across screens)

#### Layout
- `ScreenContainer` — Standard screen wrapper with safe area, background, scroll
- `AppHeader` — Back button + title + optional right element (consistent across all screens)
- `SectionHeader` — Section title + optional "View All" action

#### Buttons
- `PrimaryButton` — Filled, primary color with press animation
- `SecondaryButton` — Outline, secondary color or customizable
- `IconButton` — Circular, icon-only, configurable background

#### Input
- `TextField` — Label + input + error state + help text
- `SearchBar` — Search icon + input + clear + variants (tap-to-search, auto-focus)
- `QuantitySelector` — Minus / count / plus

#### Display
- `StatusChip` — Colored pill mapping status to color (single source of truth)
- `EmptyState` — Illustration + title + message + action
- `ErrorState` — Error display with retry
- `LoadingSkeleton` — Configurable skeleton shimmer

#### Cards
- `ServiceCard` — Service display with image, rating, price, CTA
- `ProductCard` — Product display in grid, brand, price, add/added
- `OrderCard` — Order summary for lists
- `InfoCard` — Generic info card (address, summary, details)
- `StatCard` — Metric display (number + label)

#### Navigation
- `BottomNavigation` — Tab bar with 5 items, badge support
- `Sidebar` — Admin navigation (desktop only)

#### Feedback
- `Toast` — Temporary notification (success, error, info)
- `Modal` — Full-screen or centered modal
- `BottomSheet` — Bottom-drawer interaction pattern

#### Tracking
- `Timeline` — Vertical step indicator (completed, current, pending)
- `Stepper` — Horizontal steps (progress indicator)

---

## IMPLEMENTATION NOTES

### Customer App (Reference Implementation)
- Theme tokens at `src/theme/`
- Use `theme.colors`, `theme.typography`, `theme.spacing`, `theme.radii`, `theme.shadows`
- Import from `../../theme` with the unified `theme` object

### Plumber & Store App (Migration)
- Replace existing theme files to match customer theme structure
- Remap `colors.secondary`, `colors.successLight`, etc. to unified palette
- Fix `colors.secondary` meaning (orange → blue where operational, or use correct name)

### Admin Portal
- Define JS tokens in `src/styles/tokens.ts`
- CSS variables in `globals.css` updated to match palette
- Replace duplicate helpers with imported utility functions

---

## THEME IMPLEMENTATION FILES

All four apps get token files in this structure:

```
src/
  theme/
    colors.ts      — Unified palette
    typography.ts  — Type scale
    spacing.ts     — Spacing scale
    radii.ts       — Border radius
    shadows.ts     — Elevation
    motion.ts      — Duration + easing tokens
    index.ts       — Re-export all
```

Single source of truth. No magic numbers.