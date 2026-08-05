# Main-Only Backend File Gap Analysis

## 1. Summary of Backend Diff (`Development..main`)

```text
git diff Development..main -- backend
Result: EMPTY
```

---

## 2. File Gap Analysis Table

| Component | Main Change | Development Equivalent | Missing in Development | Risk | Required Action |
| --------- | ----------- | ---------------------- | ---------------------- | ---- | --------------- |
| Dockerfile | None | Multi-stage build exposing 10000 | None | None | None |
| render.yaml | None | Standard build configuration | None | None | None |
| SecurityConfig | None | Includes `/version` permitAll | None | None | None |
| Flyway Migrations | V1–V14 | Includes V1–V19 | None | None | None |
| Controllers | Standard | Adds `VersionController` & Self-Pickup | None | None | None |
| Services | Standard | Includes plumber self-pickup | None | None | None |

---

## 3. Conclusion
`Development` has zero missing backend files, zero missing database migrations, and zero unmerged backend fixes compared to `main`.
