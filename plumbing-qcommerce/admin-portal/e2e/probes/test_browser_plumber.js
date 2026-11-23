const path = require('path');
const fs = require('fs');
const { chromium } = require('@playwright/test');
const { getStagingPassword } = require('../../scripts/staging_e2e/config');

const evidenceDir = path.resolve(__dirname, '../../FIXKART_PHASE4_QA_CERTIFICATION/screenshots');
if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });

async function main() {
  console.log('=== REAL PLAYWRIGHT TEST: PLUMBER WEB APP ===');
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  });

  const bypassToken = 'REDACTED_ROTATE_IN_VERCEL_DASHBOARD';
  const context = await browser.newContext({
    viewport: { width: 414, height: 896 },
    extraHTTPHeaders: { 'x-vercel-protection-bypass': bypassToken }
  });

  const page = await context.newPage();

  // Route API calls to staging backend
  await page.route('**/api/v1/**', async route => {
    const req = route.request();
    const u = new URL(req.url());
    const stagingUrl = `https://fixkart-backend-staging.onrender.com${u.pathname}${u.search}`;
    console.log(`[Plumber App Proxy] ${req.method()} ${u.pathname} -> staging backend`);

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
      console.log(`[Plumber Proxy Response] Status: ${response.status()} Body: ${bodyText.slice(0, 150)}`);
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
      console.error('[Plumber Proxy Error]', e.message);
      await route.abort();
    }
  });

  // Step 1: Plumber login screen
  const targetUrl = `https://fixkart-plumber-hf26u3ihl-sirupuramakhil-2873s-projects.vercel.app/`;
  console.log('1. Navigating to Plumber App:', targetUrl);
  await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(evidenceDir, 'plumber_step1_login_screen.png') });

  // Step 2: Click Email Tab
  console.log('2. Clicking "Email" tab...');
  const emailTab = page.locator('text=Email').first();
  if (await emailTab.isVisible()) {
    await emailTab.click({ force: true });
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: path.join(evidenceDir, 'plumber_step2_email_tab.png') });

  // Step 3: Enter plumber credentials
  console.log('3. Entering plumber credentials for plumber.qa@fixkart.com...');
  const inputs = page.locator('input');
  const inputCount = await inputs.count();
  console.log(`Found ${inputCount} input fields.`);

  if (inputCount >= 2) {
    await inputs.nth(0).fill('plumber.qa@fixkart.com');
    await inputs.nth(1).fill(getStagingPassword());
  } else if (inputCount === 1) {
    await inputs.first().fill('plumber.qa@fixkart.com');
  }
  await page.screenshot({ path: path.join(evidenceDir, 'plumber_step3_filled_form.png') });

  // Step 4: Click Continue
  console.log('4. Clicking Continue button...');
  const continueBtn = page.locator('text=Continue').first();
  if (await continueBtn.isVisible()) {
    await continueBtn.click({ force: true });
    await page.waitForTimeout(5000);
  }
  await page.screenshot({ path: path.join(evidenceDir, 'plumber_step4_after_continue.png') });

  const finalDom = await page.evaluate(() => document.body.innerText.slice(0, 400).replace(/\n+/g, ' '));
  console.log('Final DOM Text:', finalDom);

  await browser.close();
  console.log('=== PLUMBER WEB PLAYWRIGHT TEST COMPLETE ===');
}

main().catch(console.error);
