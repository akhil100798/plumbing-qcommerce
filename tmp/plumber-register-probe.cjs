const { chromium } = require('playwright');

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
    const signup = page.getByRole('button', { name: 'Sign up' });
    if (await signup.isVisible().catch(() => false)) await signup.click();
    await page.waitForTimeout(1200);
    const stamp = String(Date.now()).slice(-8);
    const password = `QaPlumber${stamp}Aa9!`;
    await page.getByRole('textbox', { name: 'Full name', exact: true }).fill(`QA Certification Plumber ${stamp}`);
    await page.getByRole('textbox', { name: 'Email', exact: true }).fill(`qa-plumber-${stamp}@example.com`);
    await page.getByRole('textbox', { name: 'Mobile number', exact: true }).fill(`8${stamp}1`);
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill(password);
    await page.getByRole('textbox', { name: 'Confirm password', exact: true }).fill(password);
    await page.getByRole('button', { name: 'Create Plumber Account', exact: true }).click();
    await page.waitForTimeout(6000);
    const text = await page.locator('body').innerText();
    result.status = /DASHBOARD|Incoming|Online|Home/i.test(text) && !/Registration failed|Unable to|error/i.test(text) ? 'PASS' : 'NOT TESTED';
    result.url = page.url();
    result.text = text.slice(0, 6000);
    const jobsTab = page.getByRole('tab', { name: 'Jobs', exact: true });
    if (await jobsTab.isVisible().catch(() => false)) {
      await jobsTab.click();
      await page.waitForTimeout(3000);
      result.jobsText = (await page.locator('body').innerText()).slice(0, 8000);
    }
    const availability = page.getByRole('switch', { name: 'Toggle availability' });
    const homeTab = page.getByRole('tab', { name: 'Home', exact: true });
    if (await homeTab.isVisible().catch(() => false)) await homeTab.click();
    await page.waitForTimeout(800);
    if (await availability.isVisible().catch(() => false)) {
      const checked = await availability.getAttribute('aria-checked');
      if (checked !== 'true') await availability.click();
      await page.waitForTimeout(3000);
      result.onlineText = (await page.locator('body').innerText()).slice(0, 8000);
    }
  } catch (error) {
    result.error = error.message;
  }
  result.responses = responses;
  result.errors = errors.slice(0, 20);
  console.log(JSON.stringify(result, null, 2));
  setTimeout(() => process.exit(0), 500);
})();
