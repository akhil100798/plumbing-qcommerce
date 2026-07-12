# Admin Network Summary

- Frontend tested: `https://admin-portal-ten-weld.vercel.app`
- Backend verified during UI flow: `https://plumbing-qcommerce.onrender.com`
- Credentials and tokens redacted from this summary.

## Route notes
- Current URL after login: https://admin-portal-ten-weld.vercel.app/dashboard
- /users loaded at https://admin-portal-ten-weld.vercel.app/
- /operations loaded at https://admin-portal-ten-weld.vercel.app/
- /operations/service-jobs loaded at https://admin-portal-ten-weld.vercel.app/
- /operations/material-requests loaded at https://admin-portal-ten-weld.vercel.app/

## Requests observed
- RESPONSE POST https://plumbing-qcommerce.onrender.com/api/v1/auth/login 200
- FAILED GET https://plumbing-qcommerce.onrender.com/api/v1/admin/rbac/me net::ERR_ABORTED
