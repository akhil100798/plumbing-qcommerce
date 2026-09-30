const { chromium } = require('C:/Users/akhil/node_modules/playwright');

const creds = {
  Customer: ['customer.qa@fixkart.com', 'FixKartLocal!2026'],
  Plumber: ['plumber.qa@fixkart.com', 'FixKartLocal!2026'],
  Store: ['store.qa@fixkart.com', 'FixKartLocal!2026'],
  Admin: ['admin.qa@fixkart.com', 'FixKartLocal!2026']
};
const urls = { Customer: 'http://localhost:8092', Plumber: 'http://localhost:8093', Store: 'http://localhost:8094', Admin: 'http://localhost:3100' };

const clean = s => String(s || '').replace(/\s+/g, ' ').trim();

(async () => {
  const app = process.argv[2] || 'Customer';
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [], failed = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('requestfailed', r => failed.push({ url: r.url(), error: r.failure()?.errorText || 'unknown' }));
  await page.goto(urls[app], { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);
  const before = clean(await page.locator('body').innerText());
  if (app === 'Customer' && await page.getByText('Skip', { exact: true }).count()) {
    await page.getByText('Skip', { exact: true }).click().catch(() => {});
    await page.waitForTimeout(500);
  }
  if (app === 'Plumber') {
    const tab = page.getByText('Email', { exact: true }).last();
    if (await tab.count()) await tab.click().catch(() => {});
    await page.waitForTimeout(500);
  }
  const form = clean(await page.locator('body').innerText());
  if (app === 'Customer') {
    await page.locator('input[placeholder="Enter email"]').fill(creds[app][0]);
    await page.locator('input[placeholder="Enter password"]').fill(creds[app][1]);
    await page.getByRole('button', { name: 'Login', exact: true }).click();
  } else if (app === 'Plumber') {
    const inputs = page.locator('input');
    await inputs.nth(0).fill(creds[app][0]);
    await inputs.nth(1).fill(creds[app][1]);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
  } else if (app === 'Store') {
    const inputs = page.locator('input');
    await inputs.nth(0).fill(creds[app][0]);
    await inputs.nth(1).fill(creds[app][1]);
    await page.getByRole('button', { name: 'Log In', exact: true }).click();
  } else {
    const inputs = page.locator('input');
    await inputs.nth(0).fill(creds[app][0]);
    await inputs.nth(1).fill(creds[app][1]);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  }
  await page.waitForTimeout(5000);
  const after = clean(await page.locator('body').innerText());
  const out = { app, before: before.slice(0, 1800), form: form.slice(0, 1800), after: after.slice(0, 2200), url: page.url(), errors, failed };
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
})();
