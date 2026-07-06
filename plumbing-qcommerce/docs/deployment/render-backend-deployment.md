# Render Backend Deployment

## Create PostgreSQL
1. In Render, choose `New` -> `PostgreSQL`.
2. Name it `plumbcommerce-postgres`.
3. Keep the region the same as the backend service.
4. Open `Connections` and copy the internal host, database name, username, and password.

## Create Web Service
1. In Render, choose `New` -> `Web Service`.
2. Connect the GitHub repository.
3. Set `Root Directory` to `backend`.
4. Set `Runtime` to `Docker`.
5. Set `Branch` to `main`.
6. Set the service name to `plumbcommerce-backend`.
7. Set the health check path to `/actuator/health`.

## Environment Variables
Add these values in the backend web service environment:

- `SPRING_PROFILES_ACTIVE=prod,staging`
- `PORT=10000`
- `APP_SCHEDULING_ENABLED=false`
- `APP_DEMO_SEED_ENABLED=true`
- `DATABASE_URL=jdbc:postgresql://<INTERNAL_HOST>:5432/<DB_NAME>`
- `DATABASE_USERNAME=<USER>`
- `DATABASE_PASSWORD=<PASSWORD>`
- `JWT_SECRET=<LONG_RANDOM_SECRET>`
- `CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3100,http://localhost:3101,http://localhost:19006,http://localhost:19007,http://localhost:19008,http://localhost:19009,https://admin-portal-ten-weld.vercel.app`
- `SMS_PROVIDER=disabled`

Leave these empty for the first deploy unless those services are already provisioned:

- `REDIS_HOST=`
- `REDIS_PASSWORD=`
- `MONGO_URI=`
- `KAFKA_BOOTSTRAP_SERVERS=`
- `KAFKA_USERNAME=`
- `KAFKA_PASSWORD=`

## Important Notes
- Staging demo admin users are created only when `SPRING_PROFILES_ACTIVE=prod,staging` and `APP_DEMO_SEED_ENABLED=true` are both set.
- Render staging uses `SMS_PROVIDER=disabled` with the `staging` profile so OTP/SMS messages are not sent externally.
- Real production must not use `staging` or `SMS_PROVIDER=disabled`; startup must fail unless a real SMS provider is configured.
- `DATABASE_URL` must use JDBC format: `jdbc:postgresql://host:5432/dbname`
- Do not paste `postgres://...` directly unless the application explicitly supports it.
- If the Vercel admin staging URL changes, update `CORS_ALLOWED_ORIGINS` before attempting browser UAT.
- Do not use wildcard CORS origins.

## Deploy
1. Save the environment variables.
2. Use `Manual Deploy` -> `Clear build cache & deploy`.
3. Wait for `/health/live` to return `UP`; `/actuator/health` may report optional infra health differently.
4. Test the login endpoint after health is up.
