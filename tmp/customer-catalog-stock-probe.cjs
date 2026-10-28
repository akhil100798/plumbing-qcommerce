const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: false });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const responses = [];
  const errors = [];
  page.on('response', (response) => {
    if (response.url().includes('localhost:8081')) {
      responses.push({ method: response.request().method(), path: new URL(response.url()).pathname, status: response.status() });
    }
  });
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  const result = { auth: 'NOT TESTED', search: 'NOT TESTED', outOfStock: 'NOT TESTED', responses, errors };
  try {
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        if (attempt === 1) await page.goto('http://localhost:8082', { waitUntil: 'commit', timeout: 30000 });
        else await page.reload({ waitUntil: 'commit', timeout: 30000 });
      } catch { /* bounded retry */ }
      await page.waitForTimeout(6000);
      if ((await page.locator('body').innerText().catch(() => '')).trim()) break;
    }
    result.initial = { url: page.url(), title: await page.title(), text: (await page.locator('body').innerText().catch(() => '')).slice(0, 1000) };

    const otpButton = page.getByRole('button', { name: 'Get OTP button' });
    if (await otpButton.isVisible().catch(() => false)) {
      await page.getByRole('textbox', { name: 'Mobile number input' }).fill('9876511223');
      await otpButton.click();
      await page.getByRole('button', { name: 'Verify and Proceed button' }).waitFor({ state: 'visible', timeout: 15000 });
      await page.getByRole('button', { name: 'Verify and Proceed button' }).click();
      await page.waitForTimeout(4000);
    }
    result.auth = (await page.locator('body').innerText()).includes('FixKart') ? 'PASS' : 'NOT TESTED';

    const searchTrigger = page.locator('input[placeholder*="Search plumber services"]');
    if (await searchTrigger.isVisible().catch(() => false)) {
      await searchTrigger.click();
      await page.waitForTimeout(1200);
    }
    const searchInput = page.locator('input[placeholder*="Search plumber services"]');
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('QA Low-Stock');
      await page.waitForTimeout(3000);
      result.search = (await page.locator('body').innerText()).includes('Pipe Wrench (QA Low-Stock)') ? 'PASS' : 'NOT TESTED';
      const product = page.getByText('Pipe Wrench (QA Low-Stock)', { exact: true });
      if (await product.isVisible().catch(() => false)) {
        await product.click();
        await page.waitForTimeout(3000);
        const detailText = await page.locator('body').innerText();
        result.outOfStock = detailText.includes('Out of Stock') ? 'PASS' : 'FAIL';
        result.detailText = detailText.slice(0, 5000);
      }
    }
  } catch (error) {
    result.error = error.message;
  }
  result.responses = responses;
  result.errors = errors.slice(0, 20);
  fs.writeFileSync('plumbing-qcommerce/plumbing-qcommerce/tmp/customer-catalog-stock-result.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ ...result, detailText: undefined }, null, 2));
  setTimeout(() => process.exit(0), 500);
})();
