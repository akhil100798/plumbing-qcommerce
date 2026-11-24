const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
  await page.goto('http://localhost:3100', { waitUntil: 'networkidle', timeout: 60000 });
  const html = await page.content();
  console.log(JSON.stringify({
    url: page.url(),
    title: await page.title(),
    hasEmail: html.includes('admin-email'),
    body: (await page.textContent('body')).slice(0, 500)
  }, null, 2));
  await browser.close();
})();
