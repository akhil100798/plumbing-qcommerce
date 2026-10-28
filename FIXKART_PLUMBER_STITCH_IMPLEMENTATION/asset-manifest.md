# FIXKART PLUMBER APP — ASSET MANIFEST & GEOMETRIC AUDIT

This document catalogues all 63 production vector SVG assets and 5 high-resolution raster mascot assets extracted and implemented for the FixKart Plumber App.

---

## 1. Quality & Compliance Constraints Verification

- **Size Constraint:** Every SVG must be strictly `< 10,000 bytes`.
  - **Result:** Max size is **949 bytes** (Average: **300.2 bytes**). Total SVG payload is **18.9 KB**.
- **Vector Geometry:** Valid `viewBox`, pure SVG XML, 0 raster image embeds (`<image>`), 0 base64 payloads.
- **Emoji Elimination:** 0 Unicode emojis, 0 emoji texts inside SVGs or component files.

---

## 2. Vector SVG Asset Catalog

### Navigation Icons (`src/assets/svg/navigation/`)
| Asset Name | Exported Symbol | ViewBox | Typical Size | Usage Screens |
|---|---|---|---|---|
| `home.svg` | `SvgNavHome` | `0 0 24 24` | 312 B | `04_dashboard`, `MainTabNavigator` |
| `jobs.svg` | `SvgNavJobs` | `0 0 24 24` | 328 B | `18_jobhistory`, `MainTabNavigator` |
| `earnings.svg` | `SvgNavEarnings` | `0 0 24 24` | 290 B | `16_earnings`, `MainTabNavigator` |
| `profile.svg` | `SvgNavProfile` | `0 0 24 24` | 280 B | `19_profile`, `MainTabNavigator` |
| `drawer-menu.svg` | `SvgNavDrawerMenu` | `0 0 24 24` | 240 B | `AppHeader`, `04_dashboard`, `20_drawer` |
| `arrow-left.svg` | `SvgNavArrowLeft` | `0 0 24 24` | 215 B | Global back button, all child screens |
| `arrow-right.svg` | `SvgNavArrowRight` | `0 0 24 24` | 210 B | List item chevron indicators |
| `chevron-right.svg` | `SvgNavChevronRight` | `0 0 24 24` | 198 B | Profile navigation row items |
| `chevron-down.svg` | `SvgNavChevronDown` | `0 0 24 24` | 185 B | Filter dropdowns, accordion headers |
| `close.svg` | `SvgNavClose` | `0 0 24 24` | 195 B | Modal dismiss, photo delete button |

### Action Icons (`src/assets/svg/actions/`)
| Asset Name | Exported Symbol | ViewBox | Typical Size | Usage Screens |
|---|---|---|---|---|
| `check.svg` | `SvgActionCheck` | `0 0 24 24` | 210 B | Checklists, photo approval, OTP verified |
| `call.svg` | `SvgActionCall` | `0 0 24 24` | 340 B | `06_activejob`, `07_navigation`, `08_reachedcustomer` |
| `chat.svg` | `SvgActionChat` | `0 0 24 24` | 310 B | Customer messaging, `ChatScreen` |
| `navigate.svg` | `SvgActionNavigate` | `0 0 24 24` | 305 B | Turn direction CTA, map trigger |
| `start-trip.svg` | `SvgActionStartTrip` | `0 0 24 24` | 280 B | Start navigation CTA |
| `end-trip.svg` | `SvgActionEndTrip` | `0 0 24 24` | 290 B | `07_navigation` dock CTA |
| `confirm-arrival.svg` | `SvgActionConfirmArrival` | `0 0 24 24` | 315 B | `08_reachedcustomer` arrival trigger |
| `start-work.svg` | `SvgActionStartWork` | `0 0 24 24` | 330 B | `09_startwork` begin service action |
| `camera.svg` | `SvgActionCamera` | `0 0 24 24` | 370 B | `13_beforephotos`, `14_afterphotos` |
| `add-photo.svg` | `SvgActionAddPhoto` | `0 0 24 24` | 320 B | Photo upload placeholder card |
| `plus.svg` | `SvgActionPlus` | `0 0 24 24` | 180 B | Material quantity increment stepper |
| `minus.svg` | `SvgActionMinus` | `0 0 24 24` | 165 B | Material quantity decrement stepper |
| `search.svg` | `SvgActionSearch` | `0 0 24 24` | 285 B | Inventory search, job search |
| `logout.svg` | `SvgActionLogout` | `0 0 24 24` | 310 B | `20_drawer`, Profile sign out |

### Plumbing & Domain Icons (`src/assets/svg/plumbing/`)
| Asset Name | Exported Symbol | ViewBox | Typical Size | Usage Screens |
|---|---|---|---|---|
| `wrench.svg` | `SvgPlumbWrench` | `0 0 24 24` | 350 B | Splash brand badge, app headers |
| `tap-repair.svg` | `SvgPlumbTapRepair` | `0 0 24 24` | 390 B | Tap leakage job category cards |
| `pipe-leak.svg` | `SvgPlumbPipeLeak` | `0 0 24 24` | 410 B | Pipe repair service types |
| `drain-cleaning.svg`| `SvgPlumbDrainCleaning` | `0 0 24 24` | 430 B | Drain unclogging category |
| `water-heater.svg` | `SvgPlumbWaterHeater` | `0 0 24 24` | 460 B | Geyser & heater installation jobs |
| `water-tank.svg` | `SvgPlumbWaterTank` | `0 0 24 24` | 420 B | Tank cleaning & float valve service |
| `house-building.svg`| `SvgPlumbHouseBuilding` | `0 0 24 24` | 380 B | Reached customer building radar card |

### Job Lifecycle Icons (`src/assets/svg/jobs/`)
| Asset Name | Exported Symbol | ViewBox | Typical Size | Usage Screens |
|---|---|---|---|---|
| `incoming-alert.svg`| `SvgJobIncomingAlert` | `0 0 24 24` | 360 B | `05_incomingjob` pulsating beacon |
| `active-timer.svg` | `SvgJobActiveTimer` | `0 0 24 24` | 340 B | Active service duration tracker |
| `job-complete.svg` | `SvgJobComplete` | `0 0 24 24` | 310 B | Completed service history chip |
| `job-cancelled.svg`| `SvgJobCancelled` | `0 0 24 24` | 290 B | Cancelled/declined job chip |
| `calendar.svg` | `SvgJobCalendar` | `0 0 24 24` | 320 B | Date stamps, scheduled service slots |

### Material Workflow Icons (`src/assets/svg/materials/`)
| Asset Name | Exported Symbol | ViewBox | Typical Size | Usage Screens |
|---|---|---|---|---|
| `package-box.svg` | `SvgMatPackageBox` | `0 0 24 24` | 380 B | Material request box summary |
| `store-pickup.svg` | `SvgMatStorePickup` | `0 0 24 24` | 440 B | `12_materialtracking` plumber store self-pickup |
| `material-approval.svg`| `SvgMatMaterialApproval`| `0 0 24 24` | 360 B | `11_materialapproval` status banner |
| `request-material.svg` | `SvgMatRequestMaterial` | `0 0 24 24` | 390 B | `10_materialrequest` floating trigger |
| `pipe-cpvc.svg` | `SvgMatPipeCpvc` | `0 0 24 24` | 290 B | CPVC / UPVC pipe line item icon |
| `pipe-joint.svg` | `SvgMatPipeJoint` | `0 0 24 24` | 310 B | Brass elbow & connector item icon |

### Status, Payment & Profile Icons
- **Status:** `online.svg`, `offline.svg`, `verified-badge.svg`, `star.svg`, `location-pin.svg`, `clock.svg`, `lightning.svg`, `trend-up.svg`, `alert.svg`.
- **Payments:** `wallet.svg`, `rupee.svg`, `withdraw.svg`, `receipt.svg`.
- **Profile:** `user.svg`, `bell.svg`, `settings.svg`, `document.svg`, `help.svg`.
- **Illustrations:** `empty-jobs.svg`, `empty-history.svg`, `empty-wallet.svg`.

---

## 3. Mascot & Raster Artworks (`src/assets/images/`)

High-fidelity character illustrations preserved for brand identity:
1. `circular-avatar.png` — Standard 48x48 and 80x80 plumber headshot with yellow safety cap.
2. `detailed-character.png` — Full-length plumber illustration holding pipe wrench and tool kit.
3. `hero-illustration.png` — Onboarding & splash hero visual banner.
4. `stitch-hero.png` — Auth hero curved background graphic.
5. `mascot.ts` — TypeScript dynamic asset helper exporting verified image references.
