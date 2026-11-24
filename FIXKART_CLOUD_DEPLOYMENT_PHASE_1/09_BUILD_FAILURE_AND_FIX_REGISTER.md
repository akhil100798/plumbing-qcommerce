# FixKart Cloud Deployment — Phase 1: Build Failure and Fix Register

**Execution Date:** 2026-10-27  
**DevOps Engineer / Release Auditor:** Principal DevOps Engineer & Release Manager

---

## 1. Failure and Remediation Log

### Defect 1: Git Unborn Head Ref Ambiguity
- **Symptom:** `fatal: ambiguous argument 'HEAD': unknown revision or path not in the working tree`.
- **Root Cause:** Branch `feature/plumber-app-stitch-redesign` was initialized as an unborn/orphan branch ref without an initial commit pointing to tree history.
- **Remediation:** Safely executed `git update-ref refs/heads/feature/plumber-app-stitch-redesign origin/Development-2` non-destructively, linking HEAD directly to upstream base `b8fa754b7796c50863091c1da123fddbd8fb981a` without modifying any file on disk.
- **Verification:** `git rev-parse HEAD` returned valid commit SHA `b8fa754b`.

---

### Defect 2: Windows PowerShell Script Execution Restrictions
- **Symptom:** `npx : File ...\npx.ps1 cannot be loaded because running scripts is disabled on this system`.
- **Root Cause:** Windows PowerShell `ExecutionPolicy` restricted `.ps1` execution for unauthenticated scripts.
- **Remediation:** Executed `npx.cmd` and `npm.cmd` binaries directly across all build, test, and deployment operations.
- **Verification:** All subsequent Vercel CLI and npm commands executed cleanly.

---

### Defect 3: Git Index Deleted-File Inconsistencies & Tracked Junk Files
- **Symptom:** `git status` reported staged deletions for admin-portal build files, along with tracked junk files like `backend-final-startup.err.tmp.log`, `cd`, and syntax fragments.
- **Root Cause:** Previous terminal sessions accidentally committed shell syntax artifacts into Git, and OneDrive syncing left some configuration files unlinked.
- **Remediation:**
  1. Ran `git checkout HEAD -- plumbing-qcommerce/admin-portal/` to restore legitimate Next.js files (`next.config.ts`, `Dockerfile`, `package-lock.json`).
  2. Executed `git rm` on the 6 tracked junk files.
  3. Updated root `.gitignore` to ignore evidence dirs, root node_modules, and OneDrive junction reparse points.
- **Verification:** `git status` confirmed clean working tree with 0 missing files.

---

### Defect 4: Plumber App Vercel `npm ci` Lockfile Mismatch
- **Symptom:** Vercel deployment `dpl_FJjNW8k7iVPTT2AC8F5JLbPBWZRK` failed in 10s with `npm error code EUSAGE: npm ci can only install packages when your package.json and package-lock.json are in sync. Missing: test-renderer@1.3.1 from lock file`.
- **Root Cause:** Vercel defaults to `npm ci` on Linux build containers. The lockfile lacked platform-specific optional dependencies for Linux.
- **Remediation:**
  1. Updated `plumber-app/package-lock.json` with `npm.cmd install --package-lock-only`.
  2. Created `plumbing-qcommerce/plumber-app/vercel.json` specifying:
     ```json
     {
       "installCommand": "npm install --legacy-peer-deps",
       "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
     }
     ```
  3. Committed and pushed fix `947f302`.
- **Verification:** Rebuild `dpl_HJhDzXGzHk7wU1yYCTa7UcMwP7nc` succeeded in 57s. Status: `● Ready`.

---

### Defect 5: Store Partner App Vercel `npm ci` Failure & DevDependency Bloat
- **Symptom:** Vercel deployment `dpl_HY6TgiRn1UYzuij3RyBL5cGfFHNb` failed in 10s with `npm error code EUSAGE: Missing: fsevents@2.3.3, lightningcss-android-arm64, @rolldown/binding... from lock file`.
- **Root Cause:** `playwright` devDependency was included in `store-app/package.json` despite being a test runner, and Linux optional bindings were missing from the lockfile.
- **Remediation:**
  1. Removed `playwright` from `store-app/package.json`.
  2. Updated `package-lock.json` with `npm.cmd install --package-lock-only`.
  3. Created `plumbing-qcommerce/store-app/vercel.json` specifying:
     ```json
     {
       "installCommand": "npm install --legacy-peer-deps",
       "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
     }
     ```
  4. Committed and pushed fix `947f302`.
- **Verification:** Rebuild `dpl_5feVFGkgHihJTz1cXy7if7xgTa5L` succeeded in 1m 2s. Status: `● Ready`.

---

### Defect 6: Vercel Preview Deployment Protection
- **Symptom:** HTTP GET to preview deployment URLs returned HTTP 302 with message `Protected by Vercel Authentication`.
- **Root Cause:** Vercel personal accounts enforce deployment protection on non-production preview URLs by default.
- **Remediation:**
  1. Verified preview deployment HTML rendering and assets using authenticated `vercel curl`.
  2. Assigned production domain aliases using `vercel alias set`, mapping:
     - `fixkart-plumber-web.vercel.app` -> `fixkart-plumber-7un8zw3ru`
     - `fixkart-store-web.vercel.app` -> `fixkart-store-riumaofxu`
     - `fixkart-customer-web.vercel.app` -> `fixkart-customer-mqcv6epxe`
     - `admin-portal-ten-weld.vercel.app` -> `admin-portal-5aafqusxs`
- **Verification:** Public GET requests to all 4 production domains return HTTP 200 OK without requiring authentication.
