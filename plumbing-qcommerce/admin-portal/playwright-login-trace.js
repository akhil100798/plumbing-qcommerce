const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
  const events = [];
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/v1/auth/login') || url.includes('/api/v1/admin/rbac/me')) {
      let body = '';
      try { body = await response.text(); } catch {}
      events.push({ type: 'response', url, status: response.status(), body: body.slice(0, 400) });
    }
  });
  page.on('requestfailed', request => {
    const url = request.url();
    if (url.includes('/api/v1/')) {
      events.push({ type: 'requestfailed', url, error: request.failure()?.errorText });
    }
  });
  page.on('console', msg => events.push({ type: 'console', text: msg.text() }));
  await page.goto('http://localhost:3100', { waitUntil: 'networkidle', timeout: 60000 });
  await page.fill('#email', 'superadmin@plumbcommerce.com');
  await page.fill('#password', 'password');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForTimeout(10000);
  console.log(JSON.stringify({ url: page.url(), body: (await page.textContent('body')).slice(0, 500), events }, null, 2));
  await browser.close();
})();
