# FixKart Backend Deployment Plan

## Overview
This document outlines the step-by-step deployment and rollback procedure for pushing the local `Development` branch changes to the remote repository and deploying to Render.

## Deployment Manifest
- **Commits to Publish**: 16 commits (`c268293` through `d4185a3`) plus recent health metadata commits.
- **Files Changed**:
  - `backend/src/main/java/com/pqc/core/controller/HealthController.java`
  - `backend/src/main/java/com/pqc/core/config/SecurityConfig.java`
  - `backend/src/test/java/com/pqc/core/security/HealthAndActuatorTest.java`
  - Material Pickup controllers, services, entities, DTOs
  - Flyway migrations `V15` through `V19`
- **Tests Passed**: 245+ local Maven unit/integration/security tests.
- **Secrets Scan Status**: PASS — 0 hardcoded credentials or private keys in repository.
- **Target Branch**: `Development` (`origin/Development`)
- **Render Configuration Change**: Update service build branch to `Development` in Render service settings.
- **Rollback Commit**: `c92bd6c5bad30142df33adcd75a280bbfd046bfa` (`origin/main`)
- **Rollback Procedure**: Revert Render service build branch to `main` and redeploy `c92bd6c`.

## Execution Steps (Pending User Authorization)
1. Verify git working tree safety (`git status --short`).
2. Run `git push -u origin Development`.
3. Log into Render dashboard and update `plumbcommerce-backend` service settings to build branch `Development`.
4. Trigger manual deployment on Render.
5. Monitor build and container startup logs.
6. Verify live health probes (`/health/live`, `/health/ready`, `/version`).
