const path = require('path');
const { chromium } = require('../../../admin-portal/node_modules/@playwright/test');
const baseUrl = 'http://localhost:3100';
const outDir = path.resolve(__dirname);
const ts = '2026-06-27T08-29-36-513Z';
const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJzdXBlcmFkbWluQHBsdW1iY29tbWVyY2UuY29tIiwianRpIjoiMjA1ZTljNDktYmUzNi00OWEwLWExZWMtMWJiYmQzOWNhNGE4Iiwicm9sZSI6IlNVUEVSX0FETUlOIiwiaWF0IjoxNzgyNTUwNzU4LCJleHAiOjE3ODI2MzcxNTh9.d96uej6_8F-6KZ1xdKYSId_KljqQ6BuJSnnFPK4I2os';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await page.addInitScript((value) => { sessionStorage.setItem('pqc_admin_token', value); }, token);
  for (const [prefix, route] of [['02-super-admin-dashboard','/dashboard'],['03-users-page','/users'],['04-roles-page','/roles']]) {
    await page.goto(baseUrl + route, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: path.join(outDir, `${prefix}__${ts}__super_admin__${route.replace(/^\//, '').replace(/\//g, '__')}.png`), fullPage: true });
  }
  await browser.close();
})();
