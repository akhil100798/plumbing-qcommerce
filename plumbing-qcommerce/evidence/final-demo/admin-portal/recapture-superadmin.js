const path = require('path');
const { chromium } = require('../../../admin-portal/node_modules/@playwright/test');
const baseUrl = 'http://localhost:3100';
const outDir = path.resolve(__dirname);
const ts = '2026-06-27T08-29-36-513Z';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60000 });
  await page.fill('#email', 'superadmin@plumbcommerce.com');
  await page.fill('#password', 'password');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForTimeout(7000);
  const recaptures = [
    ['02-super-admin-dashboard', '/dashboard'],
    ['03-users-page', '/users'],
    ['04-roles-page', '/roles']
  ];
  for (const [prefix, route] of recaptures) {
    await page.goto(baseUrl + route, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(outDir, `${prefix}__${ts}__super_admin__${route.replace(/^\//, '').replace(/\//g, '__')}.png`), fullPage: true });
  }
  await browser.close();
})();
