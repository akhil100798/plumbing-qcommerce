# Staging Frontend & Mobile Setup Guide

This guide describes how to configure and run the customer, plumber, and store mobile applications using the live staging backend.

## 1. Environment Configurations

All three mobile applications (customer-app, plumber-app, store-app) utilize Expo and read configurations from `.env` or `.env.local` files.

### Configuration for Live Staging Testing

Create a `.env.local` file in each app directory (`customer-app/`, `plumber-app/`, `store-app/`) with the following values:

```env
EXPO_PUBLIC_API_BASE_URL=https://plumbing-qcommerce.onrender.com/api/v1
EXPO_PUBLIC_ALLOW_MOCK_FALLBACKS=false
```

> [!IMPORTANT]
> Setting `EXPO_PUBLIC_ALLOW_MOCK_FALLBACKS=false` disables all client-side mocks, forcing the apps to use real backend API calls.

## 2. Running the Apps Locally

Run the following commands in the respective app directories:

```bash
# Install dependencies
npm install

# Start Expo dev server
npm run start
```

Press `a` to run on Android Emulator/Device or `i` to run on iOS Simulator.

## 3. Real E2E Flow Credentials

Use the pre-seeded staging accounts:

- **Customer App**:
  - Email: `customer@plumbcommerce.com`
  - Password: `password`
- **Plumber App**:
  - Email: `plumber@plumbcommerce.com`
  - Password: `password`
- **Store App**:
  - Email: `store@plumbcommerce.com`
  - Password: `password`

## 4. Phase 14G Verification Status

- **Customer App Material Approval**: Connects directly to backend `confirm` and `release` endpoints.
- **Plumber Job Sync**: Reloads active job status from `/orders/plumber` on launch.
- **Store Dispatch Rider Assignment**: Queries live available riders from `/delivery/partners` and assigns them using the `/delivery/{orderId}/assign` POST API.
