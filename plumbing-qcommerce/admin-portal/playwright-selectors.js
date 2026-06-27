const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1024 } });
  await page.goto('http://localhost:3100', { waitUntil: 'networkidle', timeout: 60000 });
  const inputs = await page.locator('input').evaluateAll(nodes => nodes.map(n => ({type: n.type, id: n.id, name: n.name, placeholder: n.placeholder} )));
  const buttons = await page.locator('button').evaluateAll(nodes => nodes.map(n => ({id: n.id, text: n.textContent && n.textContent.trim()} )));
  console.log(JSON.stringify({ inputs, buttons }, null, 2));
  await browser.close();
})();
