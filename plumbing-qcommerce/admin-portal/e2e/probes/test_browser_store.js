const path = require('path');
const fs = require('fs');
const { chromium } = require('@playwright/test');
const { getStagingPassword } = require('../../scripts/staging_e2e/config');

const evidenceDir = path.resolve(__dirname, '../../FIXKART_PHASE4_QA_CERTIFICATION/screenshots');
if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });

async function main() {
  console.log('=== REAL PLAYWRIGHT TEST: STORE PARTNER WEB APP ===');
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  });

  const bypassToken = 'REDACTED_ROTATE_IN_VERCEL_DASHBOARD';
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    extraHTTPHeaders: { 'x-vercel-protection-bypass': bypassToken }
  });

  const page = await context.newPage();

  // Route API calls to staging backend
  await page.route('**/api/v1/**', async route => {
    const req = route.request();
    const u = new URL(req.url());
    const stagingUrl = `https://fixkart-backend-staging.onrender.com${u.pathname}${u.search}`;
    console.log(`[Store App Proxy] ${req.method()} ${u.pathname} -> staging backend`);

    const headers = { ...req.headers() };
    delete headers['host'];
    delete headers['Host'];
    delete headers['origin'];
    delete headers['Origin'];
    delete headers['referer'];
    delete headers['Referer'];
    delete headers['x-vercel-protection-bypass'];
    delete headers['x-vercel-set-bypass-cookie'];
    delete headers['cookie'];

    try {
      const response = await page.request.fetch(stagingUrl, {
        method: req.method(),
        headers,
        data: req.postData()
      });
      const bodyText = await response.text();
      console.log(`[Store Proxy Response] Status: ${response.status()} Body: ${bodyText.slice(0, 150)}`);
      await route.fulfill({
        status: response.status(),
        headers: {
          ...response.headers(),
          'access-control-allow-origin': '*',
          'access-control-allow-credentials': 'true'
        },
        body: Buffer.from(bodyText, 'utf8')
      });
    } catch (e) {
      console.error('[Store Proxy Error]', e.message);
      await route.abort();
    }
  });

  // Step 1: Store login screen
  const targetUrl = `https://fixkart-store-62eazl5ni-sirupuramakhil-2873s-projects.vercel.app/`;
  console.log('1. Navigating to Store Partner App:', targetUrl);
  await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(evidenceDir, 'store_step1_login_screen.png'), fullPage: true });

  // Step 2: Enter store partner credentials
  console.log('2. Entering store partner credentials for store.qa@fixkart.com...');
  const inputs = page.locator('input');
  const inputCount = await inputs.count();
  console.log(`Found ${inputCount} input fields.`);

  if (inputCount >= 2) {
    await inputs.nth(0).fill('store.qa@fixkart.com');
    await inputs.nth(1).fill(getStagingPassword());
  }
  await page.screenshot({ path: path.join(evidenceDir, 'store_step2_filled_form.png'), fullPage: true });

  // Step 3: Click "Log In"
  console.log('3. Clicking Log In button...');
  const loginBtn = page.locator('text="Log In", text="Log in", [aria-label*="Log In"]').first();
  if (await loginBtn.isVisible()) {
    await loginBtn.click({ force: true });
    await page.waitForTimeout(5000);
  }
  await page.screenshot({ path: path.join(evidenceDir, 'store_step3_after_login.png'), fullPage: true });

  const finalDom = await page.evaluate(() => document.body.innerText.slice(0, 500).replace(/\n+/g, ' '));
  console.log('Final DOM Text:', finalDom);

  await browser.close();
  console.log('=== STORE PARTNER WEB PLAYWRIGHT TEST COMPLETE ===');
}

main().catch(console.error);
