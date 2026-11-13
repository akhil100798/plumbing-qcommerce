const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'reports', 'final-local-regression-20260916', 'runtime-20260921-targeted', 'browser-live');
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  for (const [name, url] of [['customer', 'http://localhost:8082'], ['plumber', 'http://localhost:8083']]) {
    const page = await context.newPage();
    const network = [];
    const consoleErrors = [];
    page.on('response', (response) => {
      const request = response.request();
      if (request.url().includes('localhost:8081')) {
        network.push({ method: request.method(), path: new URL(request.url()).pathname, status: response.status() });
      }
    });
    page.on('console', (msg) => { if (msg.type() === 'error' || msg.type() === 'warning') consoleErrors.push(msg.text()); });
    page.on('pageerror', (error) => consoleErrors.push(error.message));
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.screenshot({ path: path.join(outDir, `${name}-probe.png`), fullPage: true });
    const text = await page.locator('body').innerText();
    const inputs = await page.locator('input').evaluateAll((els) => els.map((el) => ({ type: el.type, placeholder: el.placeholder, aria: el.getAttribute('aria-label') })));
    const buttons = await page.locator('button').evaluateAll((els) => els.map((el) => ({ text: (el.innerText || '').trim(), aria: el.getAttribute('aria-label'), disabled: el.disabled })));
    console.log(JSON.stringify({ name, url: page.url(), text: text.slice(0, 2500), inputs, buttons, network, consoleErrors }, null, 2));
    await page.close();
  }
  await browser.close();
})();
