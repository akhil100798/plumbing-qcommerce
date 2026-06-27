const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
  await page.goto('http://localhost:3100', { waitUntil: 'networkidle', timeout: 60000 });
  await page.fill('#email', 'superadmin@plumbcommerce.com');
  await page.fill('#password', 'password');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForLoadState('networkidle', { timeout: 60000 });
  await page.waitForTimeout(3000);
  const links = await page.locator('a').evaluateAll(nodes => nodes.map(n => ({text: (n.textContent || '').trim(), href: n.getAttribute('href')})).filter(x => x.text || x.href));
  console.log(JSON.stringify({ url: page.url(), title: await page.title(), body: (await page.textContent('body')).slice(0, 1200), links }, null, 2));
  await browser.close();
})();
