const path = require('path');
const fs = require('fs');
const { chromium } = require('@playwright/test');

const evidenceDir = path.resolve(__dirname, '../../FIXKART_PHASE4_QA_CERTIFICATION/screenshots');
if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });

async function main() {
  console.log('=== REAL PLAYWRIGHT TEST: CUSTOMER WEB APP ===');
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  });

  const bypassToken = 'REDACTED_ROTATE_IN_VERCEL_DASHBOARD';
  const context = await browser.newContext({
    viewport: { width: 414, height: 896 }, // Mobile viewport (iPhone 11 Pro / standard mobile)
    extraHTTPHeaders: { 'x-vercel-protection-bypass': bypassToken }
  });

  const page = await context.newPage();

  // Route API calls to staging backend
  await page.route('**/api/v1/**', async route => {
    const req = route.request();
    const u = new URL(req.url());
    const stagingUrl = `https://fixkart-backend-staging.onrender.com${u.pathname}${u.search}`;
    console.log(`[Customer App Proxy] ${req.method()} ${u.pathname} -> staging backend`);

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
      const body = await response.body();
      await route.fulfill({
        status: response.status(),
        headers: {
          ...response.headers(),
          'access-control-allow-origin': '*',
          'access-control-allow-credentials': 'true'
        },
        body
      });
    } catch (e) {
      console.error('[Customer Proxy Error]', e.message);
      await route.abort();
    }
  });

  // Step 1: Onboarding screen
  const targetUrl = `https://fixkart-customer-axkouqjiu-sirupuramakhil-2873s-projects.vercel.app/`;
  console.log('1. Navigating to Customer App:', targetUrl);
  await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(evidenceDir, 'customer_step1_onboarding.png') });

  const textStep1 = await page.evaluate(() => document.body.innerText.slice(0, 300).replace(/\n+/g, ' '));
  console.log('Step 1 DOM Text:', textStep1);

  // Step 2: Click "Skip" or "Continue"
  console.log('2. Clicking Skip / Continue button...');
  const skipBtn = page.locator('text=Skip, text=skip, [aria-label*="Skip"], div:has-text("Skip")').last();
  if (await skipBtn.isVisible()) {
    await skipBtn.click();
  } else {
    const continueBtn = page.locator('text=Continue, text=continue, [aria-label*="Continue"]').last();
    if (await continueBtn.isVisible()) await continueBtn.click();
  }

  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(evidenceDir, 'customer_step2_after_onboarding.png') });
  const textStep2 = await page.evaluate(() => document.body.innerText.slice(0, 400).replace(/\n+/g, ' '));
  console.log('Step 2 DOM Text:', textStep2);

  // Step 3: Check for Catalog or Home elements
  console.log('3. Inspecting UI elements on screen...');
  const buttons = await page.evaluate(() => Array.from(document.querySelectorAll('div[role="button"], button')).map(b => b.innerText.trim()).filter(Boolean));
  console.log('Interactive buttons found:', buttons.slice(0, 10));

  await browser.close();
  console.log('=== CUSTOMER WEB PLAYWRIGHT TEST COMPLETE ===');
}

main().catch(console.error);
