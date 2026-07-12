# Auth Email/Password Refactor Report

## 1. Executive Summary
- Previous customer auth was blocked because the active customer UI attempted `POST /api/v1/auth/send-otp` and staging returned `404 Not Found`.
- The main customer auth flow is now refactored to email/password registration and login.
- Public registration remains limited to `CUSTOMER` only.
- Plumber login is now email/password only in the active screen.
- Store manager and admin remain email/password only.
- Production Ready remains `NO`.

## 2. Previous OTP Blocker
- Active screen before refactor: `customer-app/src/screens/auth/LoginScreenGoogle.tsx`
- Broken request: `POST https://plumbing-qcommerce.onrender.com/api/v1/auth/send-otp`
- Observed result from earlier staging UAT: `404`
- Impact: customer login blocked, full frontend E2E could not start.

## 3. New Auth Design
- Customer public auth:
  - Register with `fullName`, `email`, `phone`, `password`, `confirmPassword`
  - Login with `email`, `password`
- Privileged roles:
  - `PLUMBER`, `STORE_MANAGER`, `ADMIN` are not publicly self-registered
  - Those roles continue using email/password login only
- OTP:
  - Removed from the main customer login flow
  - No longer presented as the active login path on the customer screen

## 4. Backend Changes
Files changed:
- `backend/src/main/java/com/pqc/core/controller/AuthController.java`
- `backend/src/main/java/com/pqc/core/dto/CustomerRegistrationRequest.java`
- `backend/src/main/java/com/pqc/core/dto/AuthUserDto.java`
- `backend/src/main/java/com/pqc/core/dto/AuthResponse.java`
- `backend/src/test/java/com/pqc/core/security/AuthControllerTest.java`

Implemented behavior:
- `POST /api/v1/auth/register` now validates:
  - `fullName` required
  - `email` required and valid
  - `phone` required and valid
  - `password` required and minimum 8 chars
  - `confirmPassword` required and must match
- Registration security:
  - role always forced to `CUSTOMER`
  - status set to `ACTIVE`
  - auth provider set to `LOCAL`
  - phoneVerified set to `false`
  - profileComplete set to `true`
- Registration now returns real auth tokens and user data.
- `POST /api/v1/auth/login` now returns richer user fields (`fullName`, `phone`, profile flags) while preserving token fields used by existing apps.
- Error responses now include `message` so mobile clients display backend validation errors correctly.

## 5. Customer App Changes
Files changed:
- `customer-app/src/navigation/AuthNavigator.tsx`
- `customer-app/src/screens/auth/LoginScreenGoogle.tsx`
- `customer-app/src/screens/auth/RegisterScreen.tsx`
- `customer-app/src/services/auth/authRepository.ts`
- `customer-app/src/services/auth/authTypes.ts`
- `customer-app/src/types/navigation.ts`

Implemented behavior:
- Login screen now uses email/password as the primary path.
- Added customer registration screen.
- Registration persists the real backend token and logs the user in.
- OTP is presented only as future text, not as an active button/flow.
- Google login remains available as an optional secondary path.

## 6. Plumber / Store / Admin Auth Status
### Plumber
Files changed:
- `plumber-app/src/screens/auth/LoginScreen.tsx`

Implemented behavior:
- Active plumber login screen is now email/password only.
- Public plumber registration remains disabled.

### Store
- No auth flow change was required in the mounted screen.
- Active store auth navigator already points at `store-app/src/screens/auth/LoginScreenNew.tsx`, which uses email/password login.

### Admin
- No auth logic change was required.
- Existing admin portal email/password flow remains intact.

## 7. Validation Results
### Backend
Command:
- `backend\\.\\mvnw.cmd -Dtest=AuthControllerTest test`

Result:
- PASS
- Tests run: `18`
- Failures: `0`
- Errors: `0`
- Skipped: `0`

### Customer App
Commands:
- `customer-app\\npm run build`
- `customer-app\\npm run typecheck`

Results:
- `npm run build`: PASS
- `npm run typecheck`: FAIL due pre-existing unrelated TypeScript issues in shared UI files such as:
  - `src/components/common/AnimatedBanner.tsx`
  - `src/components/common/AnimatedStatusPill.tsx`
  - `src/components/common/LoadingSkeletonCard.tsx`
  - `src/components/tracking/EtaBadge.tsx`
  - `src/navigation/MainTabNavigator.tsx`
  - `src/screens/ProductListingScreen.tsx`

### Plumber App
Commands:
- `plumber-app\\npm run typecheck`
- `plumber-app\\npm run build`

Results:
- `npm run typecheck`: PASS
- `npm run build`: PASS

### Store App
Command:
- `store-app\\npm run typecheck`

Result:
- FAIL due pre-existing unrelated UI/theme typing issues, including:
  - `src/components/common/AnimatedBanner.tsx`
  - `src/components/common/AnimatedCard.tsx`
  - `src/components/common/AnimatedStatusPill.tsx`
  - `src/components/common/PrimaryButton.tsx`
  - `src/screens/auth/LoginScreenNew.tsx`

### Admin Portal
Command:
- `admin-portal\\npm run build`

Result:
- PASS

## 8. Real UI Auth Test Results
- Not yet executed in this Codex CLI session.
- No new screenshots or browser-network evidence were captured in this session.
- Because evidence was not captured here, no UI PASS claim is made beyond build/test verification.

## 9. Network Evidence
- No new network evidence files were created in this session.
- Required next proof:
  - customer register -> `POST /api/v1/auth/register`
  - customer login -> `POST /api/v1/auth/login`
  - customer home load after auth
  - plumber login -> `POST /api/v1/auth/login`
  - store login -> `POST /api/v1/auth/login`
  - admin login -> `POST /api/v1/auth/login`
- Required negative proof:
  - no customer request to `/api/v1/auth/send-otp`

## 10. Full E2E Retest Result
- Not run in this session.
- Customer auth blocker is addressed in code, but the full frontend UAT and golden-path retest still need live browser/device execution.

## 11. Remaining Blockers
- Customer live UI registration/login still needs screenshot and network proof.
- Full customer -> plumber -> material -> store -> completion frontend E2E still needs retest.
- Customer app typecheck has unrelated existing errors.
- Store app typecheck has unrelated existing errors.
- Working tree contains many unrelated modifications, so a clean auth-only commit still requires careful staging.

## 12. Production Pending Items
- Full frontend UI E2E must pass with evidence.
- Native mobile testing still pending.
- Existing unrelated frontend typecheck failures should be resolved.
- Production CORS, secret rotation, monitoring, backups, and release gates remain pending as previously tracked.

## 13. Final Verdict
```text
Customer Registration: PARTIAL
Customer Login: PARTIAL
Customer OTP Removed/Disabled: PASS
Plumber Login: PASS (build-verified)
Store Login: PARTIAL (existing mounted flow unchanged; live recheck pending)
Admin Login: PASS (build-verified)
Full E2E After Auth Fix: PARTIAL
Production Ready: NO
```
