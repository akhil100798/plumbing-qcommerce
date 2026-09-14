# Reproducible defects and environment/data blockers

Test date: 13 September 2026, UTC; Google Chrome 152.0.7977.84 on Windows. Application code and deployment configuration were not changed. High accessibility severity below is release severity; axe separately classifies missing-name findings as critical impact.

## BUG-PROD-BACKEND-001 — Trusted application origins rejected by login preflight

- **Application / role / module:** Backend / all affected roles / CORS
- **Severity / priority / status:** High / P0 / OPEN
- **Environment / URL:** authorized staging ecosystem, deployed web alias; https://plumbing-qcommerce.onrender.com
- **Preconditions:** fresh Chrome context; backend warm; use existing configured QA accounts only when the step requires credentials. No authenticated session is assumed.
- **Steps to reproduce:** Open customer app; Skip onboarding; enter QA email and password; click Login. Independently OPTIONS /api/v1/auth/login with each verified app Origin, Access-Control-Request-Method: POST, and Access-Control-Request-Headers: content-type.
- **Expected:** Explicitly trusted deployed origins receive a valid CORS preflight; browser can submit authentication.
- **Actual:** All four current intended app origins return 403 Invalid CORS request with no Access-Control-Allow-Origin. Customer browser reports CORS failure and Network Error.
- **HTTP/API and console evidence:** [2026-09-13T15-57-52-705Z/api-results.json](2026-09-13T15-57-52-705Z/api-results.json), [2026-09-13T15-55-49-652Z/customer-login.json](2026-09-13T15-55-49-652Z/customer-login.json). Where the finding is purely DOM/axe/deployment metadata, no HTTP failure or console exception is required or claimed.
- **Screenshot evidence:** corresponding timestamp/application entries in [evidence-index.md](evidence-index.md); API-only/deployment findings have JSON metadata rather than an invented screenshot.
- **Video/trace evidence:** not captured.
- **Frequency:** 4/4 intended-origin preflights rejected; customer browser reproduction.
- **Business impact:** Customer login and all intended web-to-backend workflows cannot be certified.
- **Security impact:** Over-restrictive CORS causes availability failure; arbitrary-origin access was rejected.
- **Suggested fix direction:** Correct the exact trusted-origin configuration for staging and its deployed clients. Preserve rejection of untrusted origins.
- **Regression risk:** repeat authentication and role restrictions after any environment/auth change; for UI/a11y changes repeat keyboard, labels and all eight sizes.

## BUG-PROD-PLUMBER-001 — Deployed client sends authentication to retired backend

- **Application / role / module:** Plumber / PLUMBER / Authentication/backend configuration
- **Severity / priority / status:** High / P0 / OPEN
- **Environment / URL:** authorized staging ecosystem, deployed web alias; https://fixkart-plumber-web.vercel.app/
- **Preconditions:** fresh Chrome context; backend warm; use existing configured QA accounts only when the step requires credentials. No authenticated session is assumed.
- **Steps to reproduce:** Open the specified app; select Email if Plumber; fill the QA login form; submit; inspect the network target.
- **Expected:** Authentication targets https://plumbing-qcommerce.onrender.com/api/v1/auth/login.
- **Actual:** The app attempts https://fixkart-dev2-backend.onrender.com/api/v1/auth/login. Browser reports CORS/network failure. Admin displays Failed to fetch.
- **HTTP/API and console evidence:** [2026-09-13T15-55-49-652Z/plumber-login.json](2026-09-13T15-55-49-652Z/plumber-login.json). Where the finding is purely DOM/axe/deployment metadata, no HTTP failure or console exception is required or claimed.
- **Screenshot evidence:** corresponding timestamp/application entries in [evidence-index.md](evidence-index.md); API-only/deployment findings have JSON metadata rather than an invented screenshot.
- **Video/trace evidence:** not captured.
- **Frequency:** Reproduced in this audit.
- **Business impact:** Role cannot log in through its deployed app; cross-app workflow blocked.
- **Security impact:** No exploit established; wrong endpoint/configuration affects release integrity and availability.
- **Suggested fix direction:** Build and deploy the approved client revision with the intended API base URL; verify actual browser traffic and invalidate stale deployment aliases.
- **Regression risk:** repeat authentication and role restrictions after any environment/auth change; for UI/a11y changes repeat keyboard, labels and all eight sizes.

## BUG-PROD-STORE-001 — Deployed client sends authentication to retired backend

- **Application / role / module:** Store / STORE_MANAGER / Authentication/backend configuration
- **Severity / priority / status:** High / P0 / OPEN
- **Environment / URL:** authorized staging ecosystem, deployed web alias; https://fixkart-store-web.vercel.app/
- **Preconditions:** fresh Chrome context; backend warm; use existing configured QA accounts only when the step requires credentials. No authenticated session is assumed.
- **Steps to reproduce:** Open the specified app; select Email if Plumber; fill the QA login form; submit; inspect the network target.
- **Expected:** Authentication targets https://plumbing-qcommerce.onrender.com/api/v1/auth/login.
- **Actual:** The app attempts https://fixkart-dev2-backend.onrender.com/api/v1/auth/login. Browser reports CORS/network failure. Admin displays Failed to fetch.
- **HTTP/API and console evidence:** [2026-09-13T15-55-49-652Z/store-login.json](2026-09-13T15-55-49-652Z/store-login.json). Where the finding is purely DOM/axe/deployment metadata, no HTTP failure or console exception is required or claimed.
- **Screenshot evidence:** corresponding timestamp/application entries in [evidence-index.md](evidence-index.md); API-only/deployment findings have JSON metadata rather than an invented screenshot.
- **Video/trace evidence:** not captured.
- **Frequency:** Reproduced in this audit.
- **Business impact:** Role cannot log in through its deployed app; cross-app workflow blocked.
- **Security impact:** No exploit established; wrong endpoint/configuration affects release integrity and availability.
- **Suggested fix direction:** Build and deploy the approved client revision with the intended API base URL; verify actual browser traffic and invalidate stale deployment aliases.
- **Regression risk:** repeat authentication and role restrictions after any environment/auth change; for UI/a11y changes repeat keyboard, labels and all eight sizes.

## BUG-PROD-ADMIN-001 — Deployed client sends authentication to retired backend

- **Application / role / module:** Admin / admin family / Authentication/backend configuration
- **Severity / priority / status:** High / P0 / OPEN
- **Environment / URL:** authorized staging ecosystem, deployed web alias; https://admin-portal-ten-weld.vercel.app/
- **Preconditions:** fresh Chrome context; backend warm; use existing configured QA accounts only when the step requires credentials. No authenticated session is assumed.
- **Steps to reproduce:** Open the specified app; select Email if Plumber; fill the QA login form; submit; inspect the network target.
- **Expected:** Authentication targets https://plumbing-qcommerce.onrender.com/api/v1/auth/login.
- **Actual:** The app attempts https://fixkart-dev2-backend.onrender.com/api/v1/auth/login. Browser reports CORS/network failure. Admin displays Failed to fetch.
- **HTTP/API and console evidence:** [2026-09-13T15-55-49-652Z/admin-login.json](2026-09-13T15-55-49-652Z/admin-login.json). Where the finding is purely DOM/axe/deployment metadata, no HTTP failure or console exception is required or claimed.
- **Screenshot evidence:** corresponding timestamp/application entries in [evidence-index.md](evidence-index.md); API-only/deployment findings have JSON metadata rather than an invented screenshot.
- **Video/trace evidence:** not captured.
- **Frequency:** Reproduced in this audit.
- **Business impact:** Role cannot log in through its deployed app; cross-app workflow blocked.
- **Security impact:** No exploit established; wrong endpoint/configuration affects release integrity and availability.
- **Suggested fix direction:** Build and deploy the approved client revision with the intended API base URL; verify actual browser traffic and invalidate stale deployment aliases.
- **Regression risk:** repeat authentication and role restrictions after any environment/auth change; for UI/a11y changes repeat keyboard, labels and all eight sizes.

## BUG-PROD-CUSTOMER-001 — Enabled Google button exposes missing-config instructions

- **Application / role / module:** Customer / CUSTOMER / Google authentication
- **Severity / priority / status:** Low / P2 / OPEN
- **Environment / URL:** authorized staging ecosystem, deployed web alias; https://fixkart-customer-web.vercel.app/
- **Preconditions:** fresh Chrome context; backend warm; use existing configured QA accounts only when the step requires credentials. No authenticated session is assumed.
- **Steps to reproduce:** Skip onboarding; click Continue with Google.
- **Expected:** Configured sign-in starts, or an unavailable feature is clearly disabled/explained in user language.
- **Actual:** Dialog says Google Client ID missing and instructs user to configure EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in customer-app/.env.
- **HTTP/API and console evidence:** [2026-09-13T16-00-43-794Z/customer-actions.json](2026-09-13T16-00-43-794Z/customer-actions.json). Where the finding is purely DOM/axe/deployment metadata, no HTTP failure or console exception is required or claimed.
- **Screenshot evidence:** corresponding timestamp/application entries in [evidence-index.md](evidence-index.md); API-only/deployment findings have JSON metadata rather than an invented screenshot.
- **Video/trace evidence:** not captured.
- **Frequency:** Reproduced in this audit.
- **Business impact:** Confusing public auth action; exposes an implementation path, not a secret.
- **Security impact:** No exploit established; wrong endpoint/configuration affects release integrity and availability.
- **Suggested fix direction:** Configure Google sign-in if in scope; otherwise disable or remove the enabled action and use user-facing copy.
- **Regression risk:** repeat authentication and role restrictions after any environment/auth change; for UI/a11y changes repeat keyboard, labels and all eight sizes.

## BUG-PROD-CUSTOMER-002 — Login back arrow has no observable destination

- **Application / role / module:** Customer / CUSTOMER / Login navigation
- **Severity / priority / status:** Low / P3 / OPEN
- **Environment / URL:** authorized staging ecosystem, deployed web alias; https://fixkart-customer-web.vercel.app/
- **Preconditions:** fresh Chrome context; backend warm; use existing configured QA accounts only when the step requires credentials. No authenticated session is assumed.
- **Steps to reproduce:** Skip onboarding; click the left arrow on the login screen.
- **Expected:** A displayed back action navigates to an available previous screen, or is omitted at the root.
- **Actual:** Same login content and URL remain; no dialog or network action.
- **HTTP/API and console evidence:** [2026-09-13T16-05-36-434Z/customer-actions.json](2026-09-13T16-05-36-434Z/customer-actions.json). Where the finding is purely DOM/axe/deployment metadata, no HTTP failure or console exception is required or claimed.
- **Screenshot evidence:** corresponding timestamp/application entries in [evidence-index.md](evidence-index.md); API-only/deployment findings have JSON metadata rather than an invented screenshot.
- **Video/trace evidence:** not captured.
- **Frequency:** Reproduced in this audit.
- **Business impact:** Minor navigation confusion.
- **Security impact:** No exploit established; wrong endpoint/configuration affects release integrity and availability.
- **Suggested fix direction:** Remove the root back affordance or connect it to the intended prior screen.
- **Regression risk:** repeat authentication and role restrictions after any environment/auth change; for UI/a11y changes repeat keyboard, labels and all eight sizes.

## BUG-PROD-PLUMBER-002 — Invalid and empty authentication forms provide no feedback

- **Application / role / module:** Plumber / PLUMBER / Form validation
- **Severity / priority / status:** Medium / P1 / OPEN
- **Environment / URL:** authorized staging ecosystem, deployed web alias; https://fixkart-plumber-web.vercel.app/
- **Preconditions:** fresh Chrome context; backend warm; use existing configured QA accounts only when the step requires credentials. No authenticated session is assumed.
- **Steps to reproduce:** Clear mobile field; Continue. Repeat with 123. Switch Email; clear both fields; Continue. Open Sign up; submit empty registration.
- **Expected:** Rejected input produces visible, accessible field errors.
- **Actual:** No visible message, native dialog, or validating API response; form stays unchanged. Empty registration behaves the same.
- **HTTP/API and console evidence:** [2026-09-13T16-02-47-798Z/plumber-actions.json](2026-09-13T16-02-47-798Z/plumber-actions.json), [2026-09-13T16-05-36-434Z/plumber-actions.json](2026-09-13T16-05-36-434Z/plumber-actions.json). Where the finding is purely DOM/axe/deployment metadata, no HTTP failure or console exception is required or claimed.
- **Screenshot evidence:** corresponding timestamp/application entries in [evidence-index.md](evidence-index.md); API-only/deployment findings have JSON metadata rather than an invented screenshot.
- **Video/trace evidence:** not captured.
- **Frequency:** Repeated blank/short mobile and email/registration checks.
- **Business impact:** User cannot tell why login/registration does not proceed.
- **Security impact:** No exploit established; wrong endpoint/configuration affects release integrity and availability.
- **Suggested fix direction:** Render inline accessible errors in the web build; ensure React Native alerts have a functional web path.
- **Regression risk:** repeat authentication and role restrictions after any environment/auth change; for UI/a11y changes repeat keyboard, labels and all eight sizes.

## BUG-PROD-STORE-002 — Empty and partial login/registration forms fail silently

- **Application / role / module:** Store / STORE_MANAGER / Form validation
- **Severity / priority / status:** Medium / P1 / OPEN
- **Environment / URL:** authorized staging ecosystem, deployed web alias; https://fixkart-store-web.vercel.app/
- **Preconditions:** fresh Chrome context; backend warm; use existing configured QA accounts only when the step requires credentials. No authenticated session is assumed.
- **Steps to reproduce:** Clear login fields and submit. Open Register Store; submit blank form; enter only manager name and malformed email and resubmit.
- **Expected:** Visible, accessible errors identify required/invalid fields.
- **Actual:** No visible message or dialog. No registration request is emitted. Adding invalid coordinates to the still-incomplete form also leaves it unchanged; independent coordinate validation remains unverified.
- **HTTP/API and console evidence:** [2026-09-13T16-00-43-794Z/store-actions.json](2026-09-13T16-00-43-794Z/store-actions.json), [2026-09-13T16-05-36-434Z/store-actions.json](2026-09-13T16-05-36-434Z/store-actions.json). Where the finding is purely DOM/axe/deployment metadata, no HTTP failure or console exception is required or claimed.
- **Screenshot evidence:** corresponding timestamp/application entries in [evidence-index.md](evidence-index.md); API-only/deployment findings have JSON metadata rather than an invented screenshot.
- **Video/trace evidence:** not captured.
- **Frequency:** Blank registration repeated in two runs.
- **Business impact:** Store onboarding stalls without explanation.
- **Security impact:** No exploit established; wrong endpoint/configuration affects release integrity and availability.
- **Suggested fix direction:** Show field-specific web validation errors and focus the first invalid field.
- **Regression risk:** repeat authentication and role restrictions after any environment/auth change; for UI/a11y changes repeat keyboard, labels and all eight sizes.

## BUG-PROD-PLUMBER-003 — OTP screen claims a code was sent without an initial send request

- **Application / role / module:** Plumber / PLUMBER / OTP
- **Severity / priority / status:** Medium / P1 / OPEN
- **Environment / URL:** authorized staging ecosystem, deployed web alias; https://fixkart-plumber-web.vercel.app/
- **Preconditions:** fresh Chrome context; backend warm; use existing configured QA accounts only when the step requires credentials. No authenticated session is assumed.
- **Steps to reproduce:** Enter the configured QA plumber mobile number; Continue; inspect the text and network events before verification/resend.
- **Expected:** A successful OTP-dispatch response precedes a code-sent message, or the app reports dispatch unavailable.
- **Actual:** UI says Enter the 6-digit code sent to the QA number, but initial Continue emits no API request. Verification/resend later target the retired backend and fail.
- **HTTP/API and console evidence:** [2026-09-13T16-05-36-434Z/plumber-actions.json](2026-09-13T16-05-36-434Z/plumber-actions.json), [2026-09-13T16-05-36-434Z/plumber-events.json](2026-09-13T16-05-36-434Z/plumber-events.json). Where the finding is purely DOM/axe/deployment metadata, no HTTP failure or console exception is required or claimed.
- **Screenshot evidence:** corresponding timestamp/application entries in [evidence-index.md](evidence-index.md); API-only/deployment findings have JSON metadata rather than an invented screenshot.
- **Video/trace evidence:** not captured.
- **Frequency:** Reproduced in this audit.
- **Business impact:** Misleading authentication state; user waits for a code whose dispatch was not attempted.
- **Security impact:** No exploit established; wrong endpoint/configuration affects release integrity and availability.
- **Suggested fix direction:** Connect Continue to the supported OTP-send contract and gate the sent message on success; otherwise disclose deferred OTP support.
- **Regression risk:** repeat authentication and role restrictions after any environment/auth change; for UI/a11y changes repeat keyboard, labels and all eight sizes.

## BUG-PROD-PLUMBER-004 — Forgot-password and social controls give no feedback

- **Application / role / module:** Plumber / PLUMBER / Public auth actions
- **Severity / priority / status:** Low / P2 / OPEN
- **Environment / URL:** authorized staging ecosystem, deployed web alias; https://fixkart-plumber-web.vercel.app/
- **Preconditions:** fresh Chrome context; backend warm; use existing configured QA accounts only when the step requires credentials. No authenticated session is assumed.
- **Steps to reproduce:** On a fresh login page, click Forgot Password?, Google, and Facebook individually.
- **Expected:** An implemented action starts, or deferred support is explained.
- **Actual:** Each click leaves text and route unchanged; no dialog or network action is observed.
- **HTTP/API and console evidence:** [2026-09-13T16-02-47-798Z/plumber-actions.json](2026-09-13T16-02-47-798Z/plumber-actions.json). Where the finding is purely DOM/axe/deployment metadata, no HTTP failure or console exception is required or claimed.
- **Screenshot evidence:** corresponding timestamp/application entries in [evidence-index.md](evidence-index.md); API-only/deployment findings have JSON metadata rather than an invented screenshot.
- **Video/trace evidence:** not captured.
- **Frequency:** Reproduced in this audit.
- **Business impact:** Dead public controls undermine auth usability.
- **Security impact:** No exploit established; wrong endpoint/configuration affects release integrity and availability.
- **Suggested fix direction:** Wire the actions or expose their unavailable state clearly.
- **Regression risk:** repeat authentication and role restrictions after any environment/auth change; for UI/a11y changes repeat keyboard, labels and all eight sizes.

## BUG-PROD-STORE-003 — Forgot Password control gives no feedback

- **Application / role / module:** Store / STORE_MANAGER / Password recovery
- **Severity / priority / status:** Low / P2 / OPEN
- **Environment / URL:** authorized staging ecosystem, deployed web alias; https://fixkart-store-web.vercel.app/
- **Preconditions:** fresh Chrome context; backend warm; use existing configured QA accounts only when the step requires credentials. No authenticated session is assumed.
- **Steps to reproduce:** On store login click Forgot Password?.
- **Expected:** Recovery opens, or unavailability/support options are explained.
- **Actual:** No route change, dialog, or network action.
- **HTTP/API and console evidence:** [2026-09-13T16-00-43-794Z/store-actions.json](2026-09-13T16-00-43-794Z/store-actions.json). Where the finding is purely DOM/axe/deployment metadata, no HTTP failure or console exception is required or claimed.
- **Screenshot evidence:** corresponding timestamp/application entries in [evidence-index.md](evidence-index.md); API-only/deployment findings have JSON metadata rather than an invented screenshot.
- **Video/trace evidence:** not captured.
- **Frequency:** Reproduced in this audit.
- **Business impact:** User has no usable recovery guidance.
- **Security impact:** No exploit established; wrong endpoint/configuration affects release integrity and availability.
- **Suggested fix direction:** Implement the action or provide truthful unavailable/support messaging.
- **Regression risk:** repeat authentication and role restrictions after any environment/auth change; for UI/a11y changes repeat keyboard, labels and all eight sizes.

## BUG-A11Y-001 — Nine registration inputs have no accessible names

- **Application / role / module:** Store / STORE_MANAGER / Registration
- **Severity / priority / status:** High / P1 / OPEN
- **Environment / URL:** authorized staging ecosystem, deployed web alias; https://fixkart-store-web.vercel.app/
- **Preconditions:** fresh Chrome context; backend warm; use existing configured QA accounts only when the step requires credentials. No authenticated session is assumed.
- **Steps to reproduce:** Open Register Store; inspect accessibility tree and run axe WCAG A/AA.
- **Expected:** Each input has a programmatically associated name.
- **Actual:** Axe label rule flags 9 inputs (critical impact); no label, aria-label, aria-labelledby, title, or placeholder provides their names.
- **HTTP/API and console evidence:** [2026-09-13T16-00-43-794Z/store-registration-axe.json](2026-09-13T16-00-43-794Z/store-registration-axe.json). Where the finding is purely DOM/axe/deployment metadata, no HTTP failure or console exception is required or claimed.
- **Screenshot evidence:** corresponding timestamp/application entries in [evidence-index.md](evidence-index.md); API-only/deployment findings have JSON metadata rather than an invented screenshot.
- **Video/trace evidence:** not captured.
- **Frequency:** Reproduced in this audit.
- **Business impact:** Screen-reader users cannot reliably identify registration fields.
- **Security impact:** Accessibility finding; no unauthorized-access exploit claimed.
- **Suggested fix direction:** Associate each visible label with its input and verify the computed accessible name.
- **Regression risk:** repeat authentication and role restrictions after any environment/auth change; for UI/a11y changes repeat keyboard, labels and all eight sizes.

## BUG-A11Y-002 — Five registration inputs have no accessible names

- **Application / role / module:** Plumber / PLUMBER / Registration
- **Severity / priority / status:** High / P1 / OPEN
- **Environment / URL:** authorized staging ecosystem, deployed web alias; https://fixkart-plumber-web.vercel.app/
- **Preconditions:** fresh Chrome context; backend warm; use existing configured QA accounts only when the step requires credentials. No authenticated session is assumed.
- **Steps to reproduce:** Click the exact Sign up link; inspect the form with axe/accessibility tree.
- **Expected:** Every input has a meaningful accessible name.
- **Actual:** Axe label rule flags all 5 registration inputs (critical impact).
- **HTTP/API and console evidence:** [2026-09-13T16-05-36-434Z/plumber-registration-axe.json](2026-09-13T16-05-36-434Z/plumber-registration-axe.json). Where the finding is purely DOM/axe/deployment metadata, no HTTP failure or console exception is required or claimed.
- **Screenshot evidence:** corresponding timestamp/application entries in [evidence-index.md](evidence-index.md); API-only/deployment findings have JSON metadata rather than an invented screenshot.
- **Video/trace evidence:** not captured.
- **Frequency:** Reproduced in this audit.
- **Business impact:** Plumber registration is inaccessible to users relying on accessible field names.
- **Security impact:** Accessibility finding; no unauthorized-access exploit claimed.
- **Suggested fix direction:** Associate labels and provide correct text/telephone/password input semantics.
- **Regression risk:** repeat authentication and role restrictions after any environment/auth change; for UI/a11y changes repeat keyboard, labels and all eight sizes.

## BUG-A11Y-003 — Six OTP inputs have no accessible names

- **Application / role / module:** Plumber / PLUMBER / OTP
- **Severity / priority / status:** High / P1 / OPEN
- **Environment / URL:** authorized staging ecosystem, deployed web alias; https://fixkart-plumber-web.vercel.app/
- **Preconditions:** fresh Chrome context; backend warm; use existing configured QA accounts only when the step requires credentials. No authenticated session is assumed.
- **Steps to reproduce:** Enter QA mobile; Continue; inspect each OTP textbox using axe/accessibility tree.
- **Expected:** OTP digits have distinct names or a single clearly labeled code input.
- **Actual:** All 6 OTP inputs fail the label rule (critical impact).
- **HTTP/API and console evidence:** [2026-09-13T16-05-36-434Z/plumber-otp-axe.json](2026-09-13T16-05-36-434Z/plumber-otp-axe.json). Where the finding is purely DOM/axe/deployment metadata, no HTTP failure or console exception is required or claimed.
- **Screenshot evidence:** corresponding timestamp/application entries in [evidence-index.md](evidence-index.md); API-only/deployment findings have JSON metadata rather than an invented screenshot.
- **Video/trace evidence:** not captured.
- **Frequency:** Reproduced in this audit.
- **Business impact:** OTP entry cannot be reliably interpreted by a screen reader.
- **Security impact:** Accessibility finding; no unauthorized-access exploit claimed.
- **Suggested fix direction:** Use a labeled single code input or uniquely label each digit and preserve focus behavior.
- **Regression risk:** repeat authentication and role restrictions after any environment/auth change; for UI/a11y changes repeat keyboard, labels and all eight sizes.

## BUG-A11Y-004 — Small supporting text falls below 4.5:1 contrast

- **Application / role / module:** Plumber / PLUMBER / Login/OTP contrast
- **Severity / priority / status:** Medium / P2 / OPEN
- **Environment / URL:** authorized staging ecosystem, deployed web alias; https://fixkart-plumber-web.vercel.app/
- **Preconditions:** fresh Chrome context; backend warm; use existing configured QA accounts only when the step requires credentials. No authenticated session is assumed.
- **Steps to reproduce:** Open email login and OTP screens; run axe color-contrast rule.
- **Expected:** Normal small text reaches at least 4.5:1.
- **Actual:** or continue with and Your data is safe with us are reported at 4.26:1 (#727785 on #faf9fd), 12px.
- **HTTP/API and console evidence:** [2026-09-13T16-02-47-798Z/plumber-login-axe.json](2026-09-13T16-02-47-798Z/plumber-login-axe.json), [2026-09-13T16-05-36-434Z/plumber-otp-axe.json](2026-09-13T16-05-36-434Z/plumber-otp-axe.json). Where the finding is purely DOM/axe/deployment metadata, no HTTP failure or console exception is required or claimed.
- **Screenshot evidence:** corresponding timestamp/application entries in [evidence-index.md](evidence-index.md); API-only/deployment findings have JSON metadata rather than an invented screenshot.
- **Video/trace evidence:** not captured.
- **Frequency:** Reproduced in this audit.
- **Business impact:** Reduced readability for low-vision users.
- **Security impact:** Accessibility finding; no unauthorized-access exploit claimed.
- **Suggested fix direction:** Darken the supporting text color and retest all affected backgrounds.
- **Regression risk:** repeat authentication and role restrictions after any environment/auth change; for UI/a11y changes repeat keyboard, labels and all eight sizes.

## BUG-A11Y-005 — Tabs and remember control lack roles/state; Sign up is absent from tab loop

- **Application / role / module:** Plumber / PLUMBER / Interactive semantics
- **Severity / priority / status:** Medium / P1 / OPEN
- **Environment / URL:** authorized staging ecosystem, deployed web alias; https://fixkart-plumber-web.vercel.app/
- **Preconditions:** fresh Chrome context; backend warm; use existing configured QA accounts only when the step requires credentials. No authenticated session is assumed.
- **Steps to reproduce:** Inspect the login accessibility tree; Tab and Shift+Tab through the controls; toggle Remember me.
- **Expected:** Tabs expose selected state, checkbox exposes checked state, and Sign up is keyboard reachable.
- **Actual:** Tabs/remember are focusable divs without roles or selected/checked semantics. The captured tab cycle omits the inline Sign up link, although exact pointer click opens registration.
- **HTTP/API and console evidence:** [2026-09-13T16-02-47-798Z/plumber-login-keyboard.json](2026-09-13T16-02-47-798Z/plumber-login-keyboard.json), [2026-09-13T16-02-47-798Z/plumber-05-login.json](2026-09-13T16-02-47-798Z/plumber-05-login.json), [2026-09-13T16-05-36-434Z/plumber-actions.json](2026-09-13T16-05-36-434Z/plumber-actions.json). Where the finding is purely DOM/axe/deployment metadata, no HTTP failure or console exception is required or claimed.
- **Screenshot evidence:** corresponding timestamp/application entries in [evidence-index.md](evidence-index.md); API-only/deployment findings have JSON metadata rather than an invented screenshot.
- **Video/trace evidence:** not captured.
- **Frequency:** Reproduced in this audit.
- **Business impact:** Keyboard and assistive-technology users receive incomplete control information.
- **Security impact:** Accessibility finding; no unauthorized-access exploit claimed.
- **Suggested fix direction:** Use appropriate interactive roles, states, and keyboard activation; make Sign up a link/button.
- **Regression risk:** repeat authentication and role restrictions after any environment/auth change; for UI/a11y changes repeat keyboard, labels and all eight sizes.

## ENV-DEPLOY-001 — Public mobile-web aliases are behind backend and repository HEAD

- **Application / role / module:** Backend / all affected roles / Release alignment
- **Severity / priority / status:** High / P1 / OPEN
- **Environment / URL:** authorized staging ecosystem, deployed web alias; https://plumbing-qcommerce.onrender.com
- **Preconditions:** fresh Chrome context; backend warm; use existing configured QA accounts only when the step requires credentials. No authenticated session is assumed.
- **Steps to reproduce:** Compare Vercel production alias metadata for customer/plumber/store with backend /version and local Development-2 HEAD.
- **Expected:** Certification targets identify the same approved release, or an explicitly approved compatibility set.
- **Actual:** All three mobile-web production aliases point to cf3fab03; backend/local HEAD is 618a8181. Ready previews at HEAD do not prove production aliases were updated.
- **HTTP/API and console evidence:** [deployment-evidence.json](deployment-evidence.json). Where the finding is purely DOM/axe/deployment metadata, no HTTP failure or console exception is required or claimed.
- **Screenshot evidence:** corresponding timestamp/application entries in [evidence-index.md](evidence-index.md); API-only/deployment findings have JSON metadata rather than an invented screenshot.
- **Video/trace evidence:** not captured.
- **Frequency:** Reproduced in this audit.
- **Business impact:** Current audit cannot certify Development-2 HEAD as the deployed ecosystem.
- **Security impact:** No exploit established; wrong endpoint/configuration affects release integrity and availability.
- **Suggested fix direction:** Align and approve the deployment set, then repeat the entire browser suite against the actual release aliases.
- **Regression risk:** repeat authentication and role restrictions after any environment/auth change; for UI/a11y changes repeat keyboard, labels and all eight sizes.

## ENV-ADMIN-002 — Development-2 admin build failed; old branch remains live

- **Application / role / module:** Admin / admin family / Deployment
- **Severity / priority / status:** High / P1 / OPEN
- **Environment / URL:** authorized staging ecosystem, deployed web alias; https://admin-portal-ten-weld.vercel.app/
- **Preconditions:** fresh Chrome context; backend warm; use existing configured QA accounts only when the step requires credentials. No authenticated session is assumed.
- **Steps to reproduce:** Inspect Vercel admin latest deployment and production alias metadata.
- **Expected:** Approved Development-2 admin build is healthy and deployed.
- **Actual:** Latest HEAD build is ERROR with missing_pages_app / npm run vercel-build exited 1. Production remains 99a19057 from phase13a-local-staging-sms, with gitDirty=1 in metadata.
- **HTTP/API and console evidence:** [deployment-evidence.json](deployment-evidence.json), [admin-build-evidence.json](admin-build-evidence.json). Where the finding is purely DOM/axe/deployment metadata, no HTTP failure or console exception is required or claimed.
- **Screenshot evidence:** corresponding timestamp/application entries in [evidence-index.md](evidence-index.md); API-only/deployment findings have JSON metadata rather than an invented screenshot.
- **Video/trace evidence:** not captured.
- **Frequency:** Reproduced in this audit.
- **Business impact:** Current role administration and least-privilege implementation cannot be certified.
- **Security impact:** No exploit established; wrong endpoint/configuration affects release integrity and availability.
- **Suggested fix direction:** Correct build root/framework commands, produce a reproducible clean build, and deploy the approved revision.
- **Regression risk:** repeat authentication and role restrictions after any environment/auth change; for UI/a11y changes repeat keyboard, labels and all eight sizes.

## ENV-ADMIN-003 — Runbook admin URL points to a different authentication surface

- **Application / role / module:** Admin / admin family / Environment documentation
- **Severity / priority / status:** Medium / P2 / OPEN
- **Environment / URL:** authorized staging ecosystem, deployed web alias; https://admin-portal-ten-weld.vercel.app/
- **Preconditions:** fresh Chrome context; backend warm; use existing configured QA accounts only when the step requires credentials. No authenticated session is assumed.
- **Steps to reproduce:** Open runbook URL https://fixkart-admin.vercel.app and compare with Vercel project domains.
- **Expected:** Runbook identifies the repository-owned deployed admin portal.
- **Actual:** Runbook URL redirects to Clerk development sign-in; actual repository project alias is admin-portal-ten-weld.vercel.app.
- **HTTP/API and console evidence:** [deployment-evidence.json](deployment-evidence.json), [2026-09-13T15-48-39-193Z/admin-landing.json](2026-09-13T15-48-39-193Z/admin-landing.json). Where the finding is purely DOM/axe/deployment metadata, no HTTP failure or console exception is required or claimed.
- **Screenshot evidence:** corresponding timestamp/application entries in [evidence-index.md](evidence-index.md); API-only/deployment findings have JSON metadata rather than an invented screenshot.
- **Video/trace evidence:** not captured.
- **Frequency:** Reproduced in this audit.
- **Business impact:** QA/operators may inspect the wrong admin environment.
- **Security impact:** No exploit established; wrong endpoint/configuration affects release integrity and availability.
- **Suggested fix direction:** Update canonical environment documentation after confirming the intended admin release URL.
- **Regression risk:** repeat authentication and role restrictions after any environment/auth change; for UI/a11y changes repeat keyboard, labels and all eight sizes.

## DATA-AUTH-001 — Repository QA fallback does not authenticate live seeded accounts

- **Application / role / module:** Backend / all affected roles / QA credentials
- **Severity / priority / status:** High / P1 / OPEN
- **Environment / URL:** authorized staging ecosystem, deployed web alias; https://plumbing-qcommerce.onrender.com
- **Preconditions:** fresh Chrome context; backend warm; use existing configured QA accounts only when the step requires credentials. No authenticated session is assumed.
- **Steps to reproduce:** Securely resolve the existing QA credential configuration; attempt one direct login for customer.qa, plumber.qa, store.qa, and admin.qa on the intended backend.
- **Expected:** Approved staging QA credentials establish the expected identities.
- **Actual:** All four return 401 Invalid credentials. APP_SEED_DEMO_PASSWORD is absent in the process environment; the one existing historical-script value tried is stale/unusable. Startup logs confirm staging seeders ran. No further password guesses were attempted.
- **HTTP/API and console evidence:** [2026-09-13T15-57-52-705Z/api-results.json](2026-09-13T15-57-52-705Z/api-results.json), [deployment-evidence.json](deployment-evidence.json). Where the finding is purely DOM/axe/deployment metadata, no HTTP failure or console exception is required or claimed.
- **Screenshot evidence:** corresponding timestamp/application entries in [evidence-index.md](evidence-index.md); API-only/deployment findings have JSON metadata rather than an invented screenshot.
- **Video/trace evidence:** not captured.
- **Frequency:** 1 direct attempt per configured QA account; 4/4 rejected.
- **Business impact:** Authenticated APIs, IDOR, session lifecycle, business workflows and persistence remain blocked.
- **Security impact:** No successful unauthorized access or usable credential exposure established.
- **Suggested fix direction:** Provide the current approved QA secret through a secure local/environment source; do not re-enable an old public default or alter account roles to make tests pass.
- **Regression risk:** repeat authentication and role restrictions after any environment/auth change; for UI/a11y changes repeat keyboard, labels and all eight sizes.
