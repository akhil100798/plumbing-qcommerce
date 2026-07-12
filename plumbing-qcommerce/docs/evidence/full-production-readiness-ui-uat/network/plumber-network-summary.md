# Plumber Network Summary

- Base URL verified during UI flow: `https://plumbing-qcommerce.onrender.com`
- Credentials and tokens redacted from this summary.

## UI observations
- Login backend response status: 200
- Post-login screen changed from the login UI.

## Screen text after Login click
```text
FixKart
HELP. FIX. EARN. REPEAT.
SP
Good Morning,
Staging Plumber
⭐
0.0
(0)
SHIFT STATUS
You are Online
TODAY'S EARNINGS
View Details ➔
₹0
0
Completed
1
Active
₹320
Wallet
Quick Actions
Active Job
History
My Wallet
Profile
Complete 3 more jobs
to earn ₹450 extra today
2 of 5 jobs completed
⚠️ INCOMING SERVICE REQUEST PENDING (View offer)
Home
Jobs
Earnings
Materials
Profile
```

## Requests observed
- RESPONSE POST https://plumbing-qcommerce.onrender.com/api/v1/auth/login 200
- RESPONSE GET https://plumbing-qcommerce.onrender.com/api/v1/users/me 200
- RESPONSE GET https://plumbing-qcommerce.onrender.com/api/v1/wallet 200
- RESPONSE GET https://plumbing-qcommerce.onrender.com/api/v1/orders/plumber 200
- RESPONSE GET https://plumbing-qcommerce.onrender.com/api/v1/orders/status/PENDING 200
