# Full E2E Network Summary

- Audit date: `2026-07-12`
- Backend target: `https://plumbing-qcommerce.onrender.com`
- Frontends exercised:
  - `customer-app` on `http://localhost:19106`
  - `plumber-app` on `http://localhost:19107`
  - `store-app` on `http://localhost:19108`
  - deployed `admin-portal` on `https://admin-portal-ten-weld.vercel.app`

## E2E status

Full cross-role E2E was **blocked** before a customer service request could be created.

## Blocking evidence

1. `customer-app`
   - `POST /api/v1/auth/send-otp` returned `404`
   - No reachable seeded email/password login path was exposed in the current customer UI capture
2. `plumber-app`
   - `POST /api/v1/auth/login` returned `200`
   - Dashboard data can load, but auth-transition behavior was not stable enough to trust full lifecycle progression for release signoff
3. `store-app`
   - Login/dashboard/tabs work
   - No real customer-created orders/material requests were available to fulfill in this audit pass

## Requests observed in the attempted E2E chain

- Customer:
  - `POST https://plumbing-qcommerce.onrender.com/api/v1/auth/send-otp 404`
- Plumber:
  - `POST https://plumbing-qcommerce.onrender.com/api/v1/auth/login 200`
  - `GET https://plumbing-qcommerce.onrender.com/api/v1/users/me 200`
  - `GET https://plumbing-qcommerce.onrender.com/api/v1/wallet 200`
  - `GET https://plumbing-qcommerce.onrender.com/api/v1/orders/plumber 200`
  - `GET https://plumbing-qcommerce.onrender.com/api/v1/orders/status/PENDING 200`
- Store:
  - `POST https://plumbing-qcommerce.onrender.com/api/v1/auth/login 200`
  - `GET https://plumbing-qcommerce.onrender.com/api/v1/ai/dashboard-metrics 200`
  - `GET https://plumbing-qcommerce.onrender.com/api/v1/checkout/material-requests/store 200`
  - `GET https://plumbing-qcommerce.onrender.com/api/v1/stores/me/inventory 200`
- Admin:
  - `POST https://plumbing-qcommerce.onrender.com/api/v1/auth/login 200`
  - `GET https://plumbing-qcommerce.onrender.com/api/v1/admin/rbac/me 200`
  - `GET https://plumbing-qcommerce.onrender.com/api/v1/admin/super/dashboard 200`

## Conclusion

The backend is reachable through multiple frontends, but the full customer → plumber → store → customer production path was **not proven** through the UI in this audit run.
