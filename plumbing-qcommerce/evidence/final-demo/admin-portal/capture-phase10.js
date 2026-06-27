const fs = require('fs');
const path = require('path');
const { chromium } = require('../../../admin-portal/node_modules/@playwright/test');

const baseUrl = 'http://localhost:3100';
const outDir = path.resolve(__dirname);
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

const roles = {
  super_admin: { email: 'superadmin@plumbcommerce.com', password: 'password' },
  operations_admin: { email: 'operations@plumbcommerce.com', password: 'password' },
  finance_admin: { email: 'finance@plumbcommerce.com', password: 'password' },
  support_admin: { email: 'support@plumbcommerce.com', password: 'password' },
  plumber_manager: { email: 'plumbermanager@plumbcommerce.com', password: 'password' },
  marketing_admin: { email: 'marketing@plumbcommerce.com', password: 'password' },
};

const shots = [
  { key: '01-login-page', role: 'guest', route: '/', label: 'Login page' },
  { key: '02-super-admin-dashboard', role: 'super_admin', route: '/dashboard', label: 'Super Admin Dashboard' },
  { key: '03-users-page', role: 'super_admin', route: '/users', label: 'Users page' },
  { key: '04-roles-page', role: 'super_admin', route: '/roles', label: 'Roles page' },
  { key: '05-system-health-page', role: 'super_admin', route: '/system-health', label: 'System Health page' },
  { key: '06-operations-dashboard', role: 'operations_admin', route: '/operations', label: 'Operations Dashboard' },
  { key: '07-product-orders-page', role: 'operations_admin', route: '/operations/orders', label: 'Product Orders page' },
  { key: '08-service-jobs-page', role: 'operations_admin', route: '/operations/service-jobs', label: 'Service Jobs page' },
  { key: '09-finance-dashboard', role: 'finance_admin', route: '/finance', label: 'Finance Dashboard' },
  { key: '10-payments-page', role: 'finance_admin', route: '/finance/payments', label: 'Payments page' },
  { key: '11-refunds-page', role: 'finance_admin', route: '/finance/refunds', label: 'Refunds page' },
  { key: '12-support-dashboard', role: 'support_admin', route: '/support', label: 'Support Dashboard' },
  { key: '13-tickets-page', role: 'support_admin', route: '/support/tickets', label: 'Tickets page' },
  { key: '14-plumber-manager-dashboard', role: 'plumber_manager', route: '/plumber-manager', label: 'Plumber Manager Dashboard' },
  { key: '15-kyc-approvals-page', role: 'plumber_manager', route: '/plumber-manager/kyc', label: 'KYC Approvals page' },
  { key: '16-marketing-dashboard', role: 'marketing_admin', route: '/marketing', label: 'Marketing Dashboard' },
  { key: '17-offers-page', role: 'marketing_admin', route: '/marketing/offers', label: 'Offers page' },
  { key: '18-campaigns-page', role: 'marketing_admin', route: '/marketing/campaigns', label: 'Campaigns page' },
  { key: '19-forbidden-access-page', role: 'operations_admin', route: '/finance', label: 'Forbidden Access page', attemptedRoute: '/finance' },
  { key: '20-logout-login-page', role: 'guest', route: '/', label: 'Logout/Login page' },
];

function routeSlug(route) {
  return route === '/' ? 'root' : route.replace(/^\//, '').replace(/\//g, '__');
}

async function waitForSettled(page) {
  await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(2500);
}

async function login(page, roleKey) {
  const role = roles[roleKey];
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60000 });
  await page.fill('#email', role.email);
  await page.fill('#password', role.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await waitForSettled(page);
}

async function logout(page) {
  const button = page.getByRole('button', { name: /logout/i });
  if (await button.count()) {
    await button.click();
    await waitForSettled(page);
  }
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const metadata = [];

  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60000 });
  await waitForSettled(page);

  for (const shot of shots) {
    if (shot.role === 'guest') {
      await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60000 });
      await waitForSettled(page);
    } else {
      const stateRole = await page.locator('body').textContent().catch(() => '');
      const needsLogin = !stateRole || stateRole.includes('Sign in') || page.url() === `${baseUrl}/` || page.url() === baseUrl;
      if (needsLogin) {
        await login(page, shot.role);
      }
      await page.goto(baseUrl + shot.route, { waitUntil: 'networkidle', timeout: 60000 });
      await waitForSettled(page);
    }

    const fileName = `${shot.key}__${timestamp}__${shot.role}__${routeSlug(shot.route)}.png`;
    await page.screenshot({ path: path.join(outDir, fileName), fullPage: true });

    metadata.push({
      fileName,
      label: shot.label,
      role: shot.role,
      route: shot.attemptedRoute || shot.route,
      finalUrl: page.url(),
      timestamp,
    });

    if (shot.key === '05-system-health-page') {
      await logout(page);
    }
    if (shot.key === '08-service-jobs-page') {
      await logout(page);
    }
    if (shot.key === '11-refunds-page') {
      await logout(page);
    }
    if (shot.key === '13-tickets-page') {
      await logout(page);
    }
    if (shot.key === '15-kyc-approvals-page') {
      await logout(page);
    }
    if (shot.key === '18-campaigns-page') {
      await logout(page);
    }
    if (shot.key === '19-forbidden-access-page') {
      await logout(page);
    }
  }

  fs.writeFileSync(path.join(outDir, `screenshot-index__${timestamp}.json`), JSON.stringify(metadata, null, 2));
  console.log(JSON.stringify({ outDir, timestamp, shots: metadata.length }, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

