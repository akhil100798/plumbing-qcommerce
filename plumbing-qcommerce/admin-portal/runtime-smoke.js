const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const baseUrl = 'http://localhost:3100';
const outDir = 'D:/personal project/plumbing-qcommerce/evidence/admin-runtime-smoke';
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

const roles = [
  { key: 'super_admin', email: 'superadmin@plumbcommerce.com', password: 'password', landing: '/dashboard', shot: 'superadmin-dashboard' },
  { key: 'operations_admin', email: 'operations@plumbcommerce.com', password: 'password', landing: '/operations', shot: 'operations-dashboard', forbidden: '/finance' },
  { key: 'finance_admin', email: 'finance@plumbcommerce.com', password: 'password', landing: '/finance', shot: 'finance-dashboard', forbidden: '/operations' },
  { key: 'support_admin', email: 'support@plumbcommerce.com', password: 'password', landing: '/support', shot: 'support-dashboard', forbidden: '/finance' },
  { key: 'plumber_manager', email: 'plumbermanager@plumbcommerce.com', password: 'password', landing: '/plumber-manager', shot: 'plumber-manager-dashboard', forbidden: '/marketing' },
  { key: 'marketing_admin', email: 'marketing@plumbcommerce.com', password: 'password', landing: '/marketing', shot: 'marketing-dashboard', forbidden: '/support' }
];

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const summary = [];

  async function login(page, role) {
    await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60000 });
    await page.fill('#email', role.email);
    await page.fill('#password', role.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForTimeout(5000);
    if (page.url() === baseUrl + '/' || page.url() === baseUrl) {
      await page.goto(baseUrl + role.landing, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(3000);
    }
  }

  const loginPage = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
  await loginPage.goto(baseUrl, { waitUntil: 'networkidle', timeout: 60000 });
  await loginPage.screenshot({ path: path.join(outDir, `login-page__${timestamp}__guest__root.png`), fullPage: true });
  await loginPage.close();

  for (const role of roles) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
    await login(page, role);
    const currentUrl = page.url();
    const links = await page.locator('a').evaluateAll(nodes => nodes.map(n => ({ text: (n.textContent || '').trim(), href: n.getAttribute('href') })).filter(x => x.href));
    const body = await page.textContent('body');
    await page.screenshot({ path: path.join(outDir, `${role.shot}__${timestamp}__${role.key}__${new URL(currentUrl).pathname.replace(/\//g, '_') || 'root'}.png`), fullPage: true });

    let forbidden = null;
    if (role.forbidden) {
      await page.goto(baseUrl + role.forbidden, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(3000);
      forbidden = { attempted: role.forbidden, finalUrl: page.url(), body: (await page.textContent('body')).slice(0, 600) };
      if (role.key === 'operations_admin') {
        await page.screenshot({ path: path.join(outDir, `forbidden-access-example__${timestamp}__${role.key}__${role.forbidden.replace(/\//g, '_')}.png`), fullPage: true });
      }
    }

    if (role.key === 'super_admin') {
      await page.goto(baseUrl + '/system-health', { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: path.join(outDir, `system-health-page__${timestamp}__${role.key}__system-health.png`), fullPage: true });
    }

    summary.push({
      role: role.key,
      email: role.email,
      landingExpected: role.landing,
      currentUrl,
      links,
      body: body.slice(0, 1200),
      forbidden
    });

    await page.getByRole('button', { name: /logout/i }).click();
    await page.waitForTimeout(3000);
    if (role.key === 'marketing_admin') {
      await page.screenshot({ path: path.join(outDir, `login-after-logout__${timestamp}__guest__root.png`), fullPage: true });
    }
    await page.close();
  }

  fs.writeFileSync(path.join(outDir, `runtime-summary__${timestamp}.json`), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify({ timestamp, outDir, roles: summary.map(r => ({ role: r.role, currentUrl: r.currentUrl, forbidden: r.forbidden && r.forbidden.finalUrl })) }, null, 2));
  await browser.close();
})();
