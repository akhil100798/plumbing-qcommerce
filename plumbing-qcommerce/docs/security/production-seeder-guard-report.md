# Production Seeder Guard Report

Documenting the database data seeder safety architecture implemented in Phase 12D to prevent demo, admin, and catalog data seeding from executing in production environments.

## 1. Previous Risk

Before Phase 12D implementation, database seeders (`CatalogDataSeeder` and `AdminDemoDataSeeder`) posed a significant production risk:
- **`CatalogDataSeeder`** ran unconditionally across all active profiles, seeding administrative accounts and store manager accounts with a weak default password (`"password"`).
- **`AdminDemoDataSeeder`** was configured with `@Profile("!test")` which meant it ran automatically on all other profiles, including the production profile (`prod`), creating a large volume of fake orders, tickets, and user accounts with weak passwords.
- Wildcard profile matching or profile configuration errors could easily result in demo users with known weak credentials being created on production systems, constituting a major data leak and authentication bypass vulnerability.

## 2. Files Changed

- [SeedProperties.java](file:///d:/personal project/plumbing-qcommerce/backend/src/main/java/com/pqc/core/config/SeedProperties.java) (NEW)
- [CatalogDataSeeder.java](file:///d:/personal project/plumbing-qcommerce/backend/src/main/java/com/pqc/core/config/CatalogDataSeeder.java)
- [AdminDemoDataSeeder.java](file:///d:/personal project/plumbing-qcommerce/backend/src/main/java/com/pqc/core/config/AdminDemoDataSeeder.java)
- [application.yml](file:///d:/personal project/plumbing-qcommerce/backend/src/main/resources/application.yml)
- [application-prod.properties](file:///d:/personal project/plumbing-qcommerce/backend/src/main/resources/application-prod.properties)
- [.env.render.example](file:///d:/personal project/plumbing-qcommerce/backend/.env.render.example)
- [.env.cloudrun.example](file:///d:/personal project/plumbing-qcommerce/backend/.env.cloudrun.example)
- [SeedPropertiesTest.java](file:///d:/personal project/plumbing-qcommerce/backend/src/test/java/com/pqc/core/config/SeedPropertiesTest.java) (NEW)
- [AdminDemoDataSeederProfileTest.java](file:///d:/personal project/plumbing-qcommerce/backend/src/test/java/com/pqc/core/config/AdminDemoDataSeederProfileTest.java) (NEW)
- [CatalogDataSeederProfileTest.java](file:///d:/personal project/plumbing-qcommerce/backend/src/test/java/com/pqc/core/config/CatalogDataSeederProfileTest.java) (NEW)

## 3. New Seeder Policy

Production deployment operates under a strict Zero-Trust seeding model. Under this policy, no seeders will register as active Spring beans or run automatically when the `prod` profile is active. Furthermore, any attempt to force-enable seeding in production will trigger a startup fast-fail check.

### AdminDemoDataSeeder Policy:
- **Bean Registration Guard**: Only registers when the active profile matches `!prod & (local | dev | demo | test)`.
- **Property Guard**: Only runs when `app.seed.admin-demo-enabled` is explicitly set to `true`.
- **Credential Protection**: Uses configured `app.seed.demo-password` rather than hardcoded password strings.

### CatalogDataSeeder Policy:
- **Bean Registration Guard**: Only registers when the active profile matches `!prod & (local | dev | demo | test)`.
- **Property Guard**: Only runs when `app.seed.catalog-enabled` is explicitly set to `true`.
- **Credential Protection**: Uses configured `app.seed.demo-password` rather than hardcoded password strings.

## 4. Profile Restrictions

Using Boolean expression profile filters prevents bean initialization under any profile configuration that includes `prod`. 
- `@Profile("!prod & (local | dev | demo | test)")`
Even if `prod` is combined with `demo` or `local` profiles (e.g. `-Dspring.profiles.active=prod,demo`), the `!prod` condition evaluates to false, completely preventing bean registration.

## 5. Property Restrictions

Seeders are disabled by default. Enabling them requires setting explicit configuration properties:
- `app.seed.catalog-enabled=true` (must be explicitly true to run catalog seeder)
- `app.seed.admin-demo-enabled=true` (must be explicitly true to run admin demo seeder)

## 6. Production Behavior

- The `prod` profile disables bean registration for both seeders.
- `SeedProperties` validates settings during startup. If the profile includes `prod` and any seeder is enabled (when `fail-if-prod-demo-enabled=true`), an `IllegalStateException` is thrown, halting Spring Boot startup immediately.
- If seeding is somehow forced with `fail-if-prod-demo-enabled=false`, `SeedProperties` validates the password strength. If the password is blank, or set to insecure defaults (`password`, `admin`, `123456`), startup fails.

## 7. Local/Demo Behavior

- Developers can activate seeders by setting `-Dspring.profiles.active=local` (or `dev`/`demo`/`test`) and setting the properties `app.seed.catalog-enabled=true` or `app.seed.admin-demo-enabled=true`.
- Default passwords can be overridden via `app.seed.demo-password`.

## 8. Tests Added

1. **SeedPropertiesTest**: 
   - Asserts startup validation passes when prod has seeding disabled.
   - Asserts startup fails when prod has any seeding enabled.
   - Asserts startup fails on mixed profiles (e.g., `prod,demo`) when seeding is enabled.
   - Asserts startup fails if a weak password is provided on prod (e.g. `password`, `admin`, `123456`, or blank).
2. **AdminDemoDataSeederProfileTest**:
   - Asserts seeder bean registers under `local` profile when `admin-demo-enabled=true`.
   - Asserts seeder bean does not register under `local` profile when `admin-demo-enabled=false`.
   - Asserts seeder bean does not register under `prod` profile.
   - Asserts seeder bean does not register under mixed `prod,demo` profile.
3. **CatalogDataSeederProfileTest**:
   - Asserts seeder bean registers under `local` profile when `catalog-enabled=true`.
   - Asserts seeder bean does not register under `local` profile when `catalog-enabled=false`.
   - Asserts seeder bean does not register under `prod` profile.
   - Asserts seeder bean does not register under mixed `prod,demo` profile.

## 9. Test Results

All 16 focused seeder tests pass:
- `Tests run: 16, Failures: 0, Errors: 0, Skipped: 0`
Full backend test run confirms no new regressions were introduced (4 pre-existing failures from baseline catalog/actuator tests remain unchanged).

## 10. Security Grep Results

All "password" and default administrator email references have been verified:
- Seeder instances: Correctly refactored to read from `seedProperties.getDemoPassword()`.
- Production configs: `app.seed.demo-password` is left blank.
- Env examples: Placed with blank/disabled defaults.
- Admin emails: Found only inside seeder classes which are secured behind `!prod` profile rules.

## 11. Remaining Limitations

Production database seeding must be managed outside the application runtime (e.g. via secure Flyway migration scripts, database setup scripts, or manual database provisioning). Automatic boot-time database modification is completely disabled on production instances.
