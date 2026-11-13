const { chromium } = require('C:/Users/akhil/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const p = await b.newPage();
  await p.goto('http://localhost:8092'); await p.waitForTimeout(3000);
  if (await p.getByText('Skip', { exact: true }).count()) await p.getByText('Skip', { exact: true }).click();
  await p.locator('input[placeholder="Enter email"]').fill('customer.qa@fixkart.com');
  await p.locator('input[placeholder="Enter password"]').fill('FixKartLocal!2026');
  await p.getByRole('button', { name: 'Login' }).click(); await p.waitForTimeout(2500);
  console.log('inputs', await p.locator('input').count());
  console.log('buttons', await p.locator('button').allTextContents());
  console.log('body', (await p.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 1400));
  console.log(await p.locator('input').evaluateAll(es => es.map(e => ({ ph: e.placeholder, ro: e.readOnly, type: e.type, value: e.value }))));
  await b.close();
})();
