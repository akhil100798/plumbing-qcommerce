# Customer Network Summary

- Base URL verified during UI flow: `https://plumbing-qcommerce.onrender.com`
- Credentials and tokens redacted from this summary.

## UI observations
- Customer app login screen currently exposes OTP and Google flows; staging email/password login was not reachable in this capture.
- Send OTP backend response status: 404

## Screen text after Send OTP
```text
Welcome back!
Sign in to access premium home services
Mobile Number
+91
Send OTP
or continue with
Continue with Google
Demo login (Staging Email/Password)
Demo: Open Complete Profile Screen
```

## Requests observed
- RESPONSE POST https://plumbing-qcommerce.onrender.com/api/v1/auth/send-otp 404
