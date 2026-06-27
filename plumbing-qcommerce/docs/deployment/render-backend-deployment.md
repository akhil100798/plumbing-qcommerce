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

- `SPRING_PROFILES_ACTIVE=prod`
- `PORT=10000`
- `APP_SCHEDULING_ENABLED=false`
- `DATABASE_URL=jdbc:postgresql://<INTERNAL_HOST>:5432/<DB_NAME>`
- `DATABASE_USERNAME=<USER>`
- `DATABASE_PASSWORD=<PASSWORD>`
- `JWT_SECRET=<LONG_RANDOM_SECRET>`
- `CORS_ALLOWED_ORIGINS=https://your-admin-portal.vercel.app,http://localhost:3100`

Leave these empty for the first deploy unless those services are already provisioned:

- `REDIS_HOST=`
- `REDIS_PASSWORD=`
- `MONGO_URI=`
- `KAFKA_BOOTSTRAP_SERVERS=`
- `KAFKA_USERNAME=`
- `KAFKA_PASSWORD=`

## Important Notes
- `DATABASE_URL` must use JDBC format: `jdbc:postgresql://host:5432/dbname`
- Do not paste `postgres://...` directly unless the application explicitly supports it.
- If an earlier bad database state exists, create a fresh empty Render PostgreSQL instance before redeploying.

## Deploy
1. Save the environment variables.
2. Use `Manual Deploy` -> `Clear build cache & deploy`.
3. Wait for `/actuator/health` to return healthy JSON.
4. Test the login endpoint after health is up.
