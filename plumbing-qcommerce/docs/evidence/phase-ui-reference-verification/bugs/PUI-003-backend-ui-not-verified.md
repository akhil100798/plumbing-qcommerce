Bug ID: PUI-003
App: customer-app / plumber-app / store-app
Role: all
Screen: Backend-connected login/deep workflows
Steps to reproduce: Open built web app and attempt automated login/navigation through UI.
Expected: Login POST to https://plumbing-qcommerce.onrender.com and dashboard/deep pages reachable.
Actual: Screenshot pass captured visible app UI, but no backend API requests were observed during the automated pass; many deep workflow pages remain blocked by auth/seed/navigation reachability.
Backend request: No backend request captured.
Screenshot: See app screenshot folders.
Severity: High
Blocking UAT: YES