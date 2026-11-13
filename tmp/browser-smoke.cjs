const { chromium } = require('C:/Users/akhil/node_modules/playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const out = path.resolve(__dirname, '../reports/local-1250-20260928-fixed/browser-evidence');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const targets = [
    ['customer', 'http://localhost:8092'],
    ['plumber', 'http://localhost:8093'],
    ['store', 'http://localhost:8094'],
    ['admin', 'http://localhost:3100'],
  ];
  const results = [];
  for (const [name, url] of targets) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const consoleMessages = [];
    const failedRequests = [];
    page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') consoleMessages.push({ type: m.type(), text: m.text() }); });
    page.on('requestfailed', r => failedRequests.push({ url: r.url(), error: r.failure()?.errorText || 'unknown' }));
    let error = null;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: path.join(out, `${name}-landing.png`), fullPage: true });
    } catch (e) { error = String(e); }
    results.push({ name, url, finalUrl: page.url(), title: await page.title().catch(() => ''), text: (await page.locator('body').innerText().catch(() => '')).slice(0, 4000), links: await page.locator('a').allTextContents().catch(() => []), buttons: await page.locator('button').allTextContents().catch(() => []), inputs: await page.locator('input').count().catch(() => -1), consoleMessages, failedRequests, error });
    await page.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(out, 'browser-smoke.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
})();
