# FixKart repository cleanup inventory

Date: 2026-09-17

## Git state captured before cleanup

- Repository root: `C:/Users/akhil/OneDrive/Desktop/Workspace/fixkart/plumbing-qcommerce`
- Branch: `Development-2`
- HEAD: `431c9f123767d4936c99681f740884cfa775f1c8`
- Cached origin/Development-2: `096fe3c86e71c56302dc63a2004d87b5debb11cc`
- Ahead/behind: `2 / 0`
- `git fetch origin`: attempted; blocked by the configured proxy/GitHub network path. No refs changed.
- Initial modified tracked files: 19
- Initial Git-visible untracked files: 590
- Initial untracked status entries: 12 (directory entries aggregate many files)
- `git diff --check`: passed; only CRLF conversion warnings were emitted.

## Modified tracked product files

All are retained as Category A or B after diff review:

- `plumbing-qcommerce/customer-app/src/screens/auth/LoginScreen.tsx`
- `plumbing-qcommerce/customer-app/src/services/api/apiClient.ts`
- `plumbing-qcommerce/customer-app/src/services/authService.tsx`
- `plumbing-qcommerce/plumber-app/App.test.tsx`
- `plumbing-qcommerce/plumber-app/src/components/forms/OTPInput.tsx`
- `plumbing-qcommerce/plumber-app/src/screens/auth/LoginScreen.tsx`
- `plumbing-qcommerce/plumber-app/src/screens/auth/OtpScreen.tsx`
- `plumbing-qcommerce/plumber-app/src/screens/auth/RegisterScreen.tsx`
- `plumbing-qcommerce/plumber-app/src/screens/materials/MaterialTrackingScreen.tsx`
- `plumbing-qcommerce/plumber-app/src/services/materials/materialService.ts`
- `plumbing-qcommerce/plumber-app/src/services/photos/photoService.ts`
- `plumbing-qcommerce/store-app/src/navigation/MainTabNavigator.tsx`
- `plumbing-qcommerce/store-app/src/screens/auth/LoginScreenNew.tsx`
- `plumbing-qcommerce/store-app/src/screens/auth/RegisterScreen.tsx`
- `plumbing-qcommerce/store-app/src/screens/dashboard/DashboardScreen.tsx`
- `plumbing-qcommerce/store-app/src/screens/orders/CollectionConfirmationScreen.tsx`
- `plumbing-qcommerce/store-app/src/screens/orders/MaterialRequestsScreen.tsx`
- `plumbing-qcommerce/store-app/src/theme/colors.ts`

## Untracked trees and files

- `plumbing-qcommerce/plumber-app/src/services/materials/materialService.resume.test.ts` — one maintained unit test for the persisted Resume transition.
- `plumbing-qcommerce/reports/final-local-regression-20260916/` — 166 files; authoritative final local certification and lifecycle evidence. Retain the compact report/ledger/evidence set and selected supporting raw evidence; remove only one-off generators, duplicate screenshots, and disposable fixture/debug output listed in the cleanup plan.
- `plumbing-qcommerce/reports/full-local-regression-20260916/` — 108 files; superseded bulky local run. Archive outside the repository.
- `plumbing-qcommerce/reports/release-blocker-runtime-certification-20260915/` — 338 files; superseded but useful historical runtime evidence. Archive outside the repository.
- `plumbing-qcommerce/reports/secondary-remediation-20260916/` — 44 files; current targeted remediation evidence. Retain compact reports and evidence; remove one-off scripts and duplicate screenshots only after the plan is applied.
- `plumbing-qcommerce/backend/uploads/service-order-photos/` — 4 runtime-generated photo files; delete after final DB/evidence verification because storage is local runtime output, not product source.
- `plumbing-qcommerce/customer-app/dist-final-local/` — generated export; delete.
- `plumbing-qcommerce/customer-app/dist-local-qa/` — generated export; delete.
- `plumbing-qcommerce/customer-app/dist-local-qa2/` — duplicate generated export; delete.
- `artifact_paths.txt`, `tmp_artifact_focus.txt`, `tmp_artifact_list.txt` — scratch inventories; delete after this inventory is preserved.

## Clean tracked areas inspected

No dirty migration/configuration file was found. Existing tracked Flyway V21,
package manifests, lock files, environment templates, and source tests remain
untouched. Tracked historical reports were not moved or deleted.

## Secret scan

The targeted scan found no JWT-like values, Authorization values, cookies,
refresh-token values, OTP values, or API-key values in the final evidence and
generated trees. Password-like matches were documentation/field names or
redacted evidence markers, not retained secret values. No file was retained as
a secret-bearing artifact.
