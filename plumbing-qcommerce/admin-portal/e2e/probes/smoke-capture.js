const path = require('path');
const { chromium } = require('@playwright/test');
(async () => {
  const ts = process.argv[2];
  const outDir = process.argv[3];
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
  await page.goto('http://localhost:3100', { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: path.join(outDir, `login-page__${ts}__guest__root.png`), fullPage: true });
  await page.fill('#admin-email', 'superadmin@plumbcommerce.com');
  await page.fill('#admin-password', 'password');
  await page.click('#admin-login-btn');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(outDir, `login-attempt__${ts}__super_admin__root.png`), fullPage: true });
  console.log(JSON.stringify({ url: page.url(), title: await page.title(), body: await page.textContent('body') }));
  await browser.close();
})();
