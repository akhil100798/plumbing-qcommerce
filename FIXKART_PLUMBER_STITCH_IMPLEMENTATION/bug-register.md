# FIXKART PLUMBER APP — DEFECT LOG & BUG REGISTER

This document logs all defects, edge cases, regression issues, and platform quirks identified and resolved during the Google Stitch visual implementation.

---

## 1. Defect Register

| Bug ID | Component / File | Severity | Defect Description | Root Cause | Resolution | Verification Status |
|---|---|---|---|---|---|---|
| **BUG-001** | Global Codebase / Components | Critical | Unicode emojis present in 14 legacy components (`📞`, `📍`, `🔩`, `⚙`, `★`, `✓`, `⚠️`) | Legacy prototypes used quick emojis for phone, location, parts, and ratings | Built and ran automated replacement script substituting all emojis with dedicated vector SVGs (`SvgActionCall`, `SvgStatusLocationPin`, `SvgStatusStar`, etc.) | **RESOLVED** (0 emojis confirmed across codebase) |
| **BUG-002** | `src/components/common/RouteMap.tsx` | High | JSX parsing syntax error due to unescaped arrow symbol `->` | Unescaped character sequence in JSX string literal | Converted to evaluated string concatenation expression | **RESOLVED** (Syntax clean) |
| **BUG-003** | React Navigation v7 Navigators | High | TypeScript error `TS2769: Property 'id' is missing in type` | React Navigation v7 requires explicit `id` property on stack and tab navigators | Added `id="AuthStack"`, `id="MainTab"`, and `id="RootStack"` to all navigators | **RESOLVED** (0 TypeScript errors) |
| **BUG-004** | `App.test.tsx` / Test Suite | Medium | Vitest runner failed with `No "Image" export is defined on the "react-native" mock` | Incomplete mock definition in test mock factory | Added `Image: 'Image'` to top-level mocked React Native export object | **RESOLVED** (App.test.tsx passing) |
| **BUG-005** | `App.test.tsx` / Test Suite | Medium | `SyntaxError: Unexpected token 'typeof'` originating from `expo-modules-core` | Transpilation conflict when `expo-secure-store` is imported in Vitest Node environment | Added direct Vitest mock for `tokenStorage` to decouple test runner from native bridge | **RESOLVED** (12/12 suites passing) |
| **BUG-006** | `NavigationScreen.tsx` | Medium | Unhandled promise rejection if `jobService.startWork` undefined | Optional chaining missing on arrival transition callback | Added defensive check and fallback navigation handling | **RESOLVED** (Verified in unit test) |
| **BUG-007** | `19_profile` & `20_drawer` | High | Original Stitch screenshot exports were 0-byte or corrupted | Upstream Google Stitch export anomaly | Rendered original `code.html` in headless browser environment to reconstruct pixel-perfect visual spec | **RESOLVED** (100% visual fidelity restored) |
| **BUG-008** | `MaterialTrackingScreen.tsx` | High | Risk of courier/delivery agent workflow introduction | Ambiguous wording in generic Stitch pickup UI | Enforced strict FixKart plumber self-pickup workflow with store pickup OTP counter code | **RESOLVED** (Self-pickup compliant) |
| **BUG-009** | `BeforePhotosScreen.tsx` | Medium | Premature submission allowed with 0 or 1 photo | Missing client-side length guard on photo array | Enforced validation disabling "Next" button until `photos.length >= 2` | **RESOLVED** (Validation enforced) |
| **BUG-010** | `OtpScreen.tsx` | Low | Keyboard stuck on auto-focus between PIN boxes | Unsynchronized focus refs across 6 separate input boxes | Implemented forward ref array with auto-advance on text change and auto-retreat on backspace | **RESOLVED** (Fluid 6-box input experience) |
