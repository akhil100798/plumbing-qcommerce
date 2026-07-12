Bug ID: PUI-002
App: customer-app / store-app
Role: customer / store manager
Screen: Unit test validation
Steps to reproduce: Run npm test in customer-app and store-app.
Expected: Vitest suites pass.
Actual: customer-app and store-app fail because react-native test mocks do not expose Animated for newly animated components.
Backend request: N/A
Screenshot: N/A (pre-test command failure, not app UI)
Severity: Medium
Blocking UAT: NO