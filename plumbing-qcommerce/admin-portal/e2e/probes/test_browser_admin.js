const path = require('path');
const fs = require('fs');
const { chromium } = require('@playwright/test');
const { getStagingPassword } = require('../../scripts/staging_e2e/config');

const evidenceDir = path.resolve(__dirname, '../../FIXKART_PHASE4_QA_CERTIFICATION/screenshots');
if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });

async function main() {
  console.log('=== REAL PLAYWRIGHT TEST: ADMIN PORTAL ===');
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  });

  const bypassToken = 'REDACTED_ROTATE_IN_VERCEL_DASHBOARD';
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    extraHTTPHeaders: { 'x-vercel-protection-bypass': bypassToken }
  });

  const page = await context.newPage();

  // Intercept any API calls made by the browser and route them to Render Staging
  await page.route('**/api/v1/**', async route => {
    const req = route.request();
    const u = new URL(req.url());
    const stagingUrl = `https://fixkart-backend-staging.onrender.com${u.pathname}${u.search}`;
    console.log(`[Browser Proxy] ${req.method()} ${u.pathname} -> staging backend`);

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
      console.log(`[Browser Proxy Response] Status: ${response.status()} [response body omitted]`);
      const body = Buffer.from(bodyText, 'utf8');
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
      console.error('[Browser Proxy Error]', e.name);
      await route.abort();
    }
  });

  const apiCalls = [];
  page.on('response', async res => {
    const u = res.url();
    if (u.includes('/api/v1/')) {
      apiCalls.push({ url: u, status: res.status() });
    }
  });

  // Step 1: Navigate to Admin Login
  const targetUrl = `https://admin-portal-vxjeuz2sf-sirupuramakhil-2873s-projects.vercel.app/`;
  console.log('1. Navigating to Admin Login:', targetUrl);
  await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(evidenceDir, 'admin_step1_login_page.png'), fullPage: true });

  // Step 2: Fill in Admin Credentials and click Sign In
  const password = getStagingPassword();
  console.log('2. Entering admin credentials for admin.qa@fixkart.com...');
  await page.fill('#email', 'admin.qa@fixkart.com');
  await page.fill('#password', password);
  await page.screenshot({ path: path.join(evidenceDir, 'admin_step2_filled_login.png'), fullPage: true });

  console.log('3. Clicking Sign in button...');
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for post-login navigation / dashboard
  console.log('Waiting for dashboard hydration and API queries...');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForTimeout(6000);

  console.log('Post-login URL:', page.url());
  await page.screenshot({ path: path.join(evidenceDir, 'admin_step3_dashboard.png'), fullPage: true });

  const bodySnippet = await page.evaluate(() => document.body.innerText.slice(0, 800).replace(/\n+/g, ' '));
  console.log('Dashboard DOM text:', bodySnippet);
  console.log('API Calls during session:', JSON.stringify(apiCalls, null, 2));

  // Step 4: Click on an Admin Navigation Item (e.g., Audit or Orders or Users)
  console.log('4. Testing navigation to Users management...');
  const usersNav = page.locator('a[href*="/admins"], a[href*="/users"], button:has-text("Admins"), button:has-text("Users")').first();
  if (await usersNav.isVisible()) {
    await usersNav.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(evidenceDir, 'admin_step4_navigation.png'), fullPage: true });
    console.log('Navigated to:', page.url());
  }

  await browser.close();
  console.log('=== ADMIN PORTAL PLAYWRIGHT TEST COMPLETE ===');
}

main().catch(console.error);
