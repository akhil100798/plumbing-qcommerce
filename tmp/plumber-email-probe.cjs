const fs = require('fs');
const { chromium } = require('playwright');

const source = fs.readFileSync('plumbing-qcommerce/plumbing-qcommerce/run-development2-live-e2e.js', 'utf8');
const match = source.match(/const QA_PASSWORD = process\.env\.APP_SEED_DEMO_PASSWORD \|\| '([^']+)'/);
if (!match) throw new Error('QA password source contract not found');
const password = process.env.APP_SEED_DEMO_PASSWORD || match[1];

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: false, args: ['--host-resolver-rules=MAP localhost 127.0.0.1'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const responses = [];
  const errors = [];
  page.on('response', (r) => { if (r.url().includes('localhost:8081')) responses.push({ method: r.request().method(), path: new URL(r.url()).pathname, status: r.status() }); });
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  const result = { status: 'NOT TESTED', responses, errors };
  try {
    try { await page.goto('http://localhost:8083', { waitUntil: 'commit', timeout: 30000 }); } catch { result.gotoTimeout = true; }
    await page.waitForTimeout(6000);
    const emailTab = page.getByRole('tab', { name: 'Log in with email' });
    if (await emailTab.isVisible().catch(() => false)) await emailTab.click();
    const email = page.getByRole('textbox', { name: 'Email address' });
    const pass = page.getByRole('textbox', { name: 'Password' });
    if (await email.isVisible().catch(() => false) && await pass.isVisible().catch(() => false)) {
      await email.fill('plumber.qa@fixkart.com');
      await pass.fill(password);
      await page.getByRole('button', { name: 'Continue', exact: true }).click();
      await page.waitForTimeout(5000);
    }
    const text = await page.locator('body').innerText();
    result.status = /DASHBOARD|Incoming|Online|Home/i.test(text) && !/Could not log in|Invalid credentials|Unable to/i.test(text) ? 'PASS' : 'NOT TESTED';
    result.url = page.url();
    result.text = text.slice(0, 5000);
    result.tabs = await page.getByRole('tab').allTextContents().catch(() => []);
  } catch (error) {
    result.error = error.message;
  }
  result.responses = responses;
  result.errors = errors.slice(0, 20);
  console.log(JSON.stringify(result, null, 2));
  setTimeout(() => process.exit(0), 500);
})();
