const path = require('path');
const fs = require('fs');
const { chromium } = require('@playwright/test');

const apps = [
  {
    name: 'Admin Portal',
    url: 'https://admin-portal-vxjeuz2sf-sirupuramakhil-2873s-projects.vercel.app',
    bypassToken: 'REDACTED_ROTATE_IN_VERCEL_DASHBOARD',
    screenshot: '01_admin_portal_preview.png'
  },
  {
    name: 'Customer Web',
    url: 'https://fixkart-customer-axkouqjiu-sirupuramakhil-2873s-projects.vercel.app',
    bypassToken: 'REDACTED_ROTATE_IN_VERCEL_DASHBOARD',
    screenshot: '02_customer_web_preview.png'
  },
  {
    name: 'Plumber Web',
    url: 'https://fixkart-plumber-hf26u3ihl-sirupuramakhil-2873s-projects.vercel.app',
    bypassToken: 'REDACTED_ROTATE_IN_VERCEL_DASHBOARD',
    screenshot: '03_plumber_web_preview.png'
  },
  {
    name: 'Store Partner Web',
    url: 'https://fixkart-store-62eazl5ni-sirupuramakhil-2873s-projects.vercel.app',
    bypassToken: 'REDACTED_ROTATE_IN_VERCEL_DASHBOARD',
    screenshot: '04_store_web_preview.png'
  }
];

const evidenceDir = path.resolve(__dirname, '../../FIXKART_PHASE4_QA_CERTIFICATION/screenshots');
if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });

async function run() {
  console.log('=== FIXKART 4-APP VERCEL PREVIEW BROWSER VERIFICATION ===\n');
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'
  });

  const results = [];

  for (const app of apps) {
    console.log(`--- Testing ${app.name} ---`);
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      extraHTTPHeaders: {
        'x-vercel-protection-bypass': app.bypassToken
      }
    });

    const page = await context.newPage();
    const targetUrl = `${app.url}/`;
    console.log('Navigating to:', targetUrl);

    try {
      const response = await page.goto(targetUrl, { waitUntil: 'networkidle', timeout: 30000 });
      const status = response ? response.status() : 'No response';
      const title = await page.title();
      const currentUrl = page.url();

      console.log(`Status: ${status} | Title: "${title}" | Final URL: ${currentUrl}`);

      // Allow 2 seconds for client-side hydration / mounting
      await page.waitForTimeout(2000);

      const shotPath = path.join(evidenceDir, app.screenshot);
      await page.screenshot({ path: shotPath, fullPage: true });
      console.log(`Screenshot saved to: ${shotPath}`);

      const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 300).replace(/\n+/g, ' '));
      console.log(`Rendered DOM Preview: ${bodyText}\n`);

      results.push({
        name: app.name,
        status,
        title,
        finalUrl: currentUrl,
        screenshot: app.screenshot,
        preview: bodyText,
        passed: status === 200
      });
    } catch (err) {
      console.error(`Failed to load ${app.name}:`, err.name);
      results.push({
        name: app.name,
        status: 'FAILED',
        error: err.name,
        passed: false
      });
    } finally {
      await context.close();
    }
  }

  await browser.close();

  console.log('\n=== VERIFICATION SUMMARY ===');
  console.table(results.map(r => ({ App: r.name, Status: r.status, Title: r.title, Passed: r.passed })));
}

run().catch(console.error);
