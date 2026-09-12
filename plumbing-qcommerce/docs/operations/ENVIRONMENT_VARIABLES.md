# FixKart Environment Variables Specification (`ENVIRONMENT_VARIABLES.md`)

Master specification of environment variables across Backend and Frontend applications:

---

## 1. Backend Environment Variables (Render)
- `SPRING_PROFILES_ACTIVE`: `prod`
- `SPRING_DATASOURCE_URL`: `jdbc:postgresql://<RENDER_PG_HOST>:5432/<DB_NAME>`
- `SPRING_DATASOURCE_USERNAME`: `<DB_USER>`
- `SPRING_DATASOURCE_PASSWORD`: `<DB_PASSWORD>`
- `APP_JWT_SECRET`: Base64 encoded 512-bit signing secret
- `APP_CORS_ALLOWED_ORIGINS`: Allowed origins list
- `PORT`: `8080`

---

## 2. Frontend Public Environment Variables (Vercel)
- `EXPO_PUBLIC_BACKEND_URL`: `https://plumbing-qcommerce.onrender.com`
- `NEXT_PUBLIC_BACKEND_URL`: `https://plumbing-qcommerce.onrender.com`
