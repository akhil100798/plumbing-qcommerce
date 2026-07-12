Bug ID: PUI-001
App: customer-app / plumber-app / store-app
Role: all
Screen: Pre-test validation
Steps to reproduce: Run npm run typecheck in each app.
Expected: TypeScript passes.
Actual: All three apps fail typecheck. Common issues include missing spacing.xxs, missing react-native-svg types/dependency, and app-specific prop/theme mismatches.
Backend request: N/A
Screenshot: N/A (pre-test command failure, not app UI)
Severity: High
Blocking UAT: YES