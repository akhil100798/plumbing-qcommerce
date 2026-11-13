const { chromium } = require('playwright');
const crypto = require('crypto');
const childProcess = require('child_process');

function otpKey(phone) { return 'local-staging:otp:' + crypto.createHash('sha256').update(phone.replace(/\D/g, '')).digest('hex'); }
function captureOtp(phone) {
  try { return childProcess.execFileSync('C:\\Program Files\\Redis\\redis-cli.exe', ['-h', '127.0.0.1', '-p', '6379', '--raw', 'GET', otpKey(phone)], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; }
}
async function customerLogin(page, phone) {
  await page.goto('http://localhost:8082/', { waitUntil: 'domcontentloaded' });
  await page.getByText('Skip', { exact: true }).waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  const input = page.getByRole('textbox').first();
  await input.fill(phone);
  await page.getByRole('button', { name: /Get OTP/i }).click();
  await page.getByRole('button', { name: /Verify and Proceed/i }).waitFor({ state: 'visible', timeout: 10000 });
  const code = captureOtp(phone);
  if (!code) throw new Error('Customer OTP capture unavailable');
  await page.getByRole('textbox').first().fill(code);
  await page.getByRole('button', { name: /Verify and Proceed/i }).click();
  await page.getByText('HOME', { exact: true }).waitFor({ state: 'visible', timeout: 15000 });
}
async function main() {
  const out = { startedAt: new Date().toISOString(), requests: [], consoleErrors: [] };
  const browser = await chromium.launch({ headless: true });
  const customerContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const customer = await customerContext.newPage();
  customer.on('console', m => { if (m.type() === 'error') out.consoleErrors.push('customer:' + m.text()); });
  customer.on('request', r => { if (/localhost:8081/.test(r.url())) out.requests.push({ app: 'customer', method: r.method(), url: r.url(), postData: r.url().includes('verify-otp') ? '[redacted]' : (r.postData() || null) }); });
  await customerLogin(customer, '5555500002');
  await customer.getByText('Pipe Leakage Detection & Repair', { exact: true }).first().click();
  await customer.getByText('Book Plumber', { exact: true }).click();
  await customer.getByText('Proceed to Checkout', { exact: true }).click();
  await customer.getByText('Review & Payment', { exact: true }).waitFor({ state: 'visible', timeout: 10000 });
  await customer.getByRole('button', { name: /Book & Dispatch Plumber/i }).click();
  await customer.waitForTimeout(800);
  const customerToken = await customer.evaluate(() => localStorage.getItem('authToken'));
  const customerOrder = await customer.evaluate(async () => {
    const token = localStorage.getItem('authToken');
    const me = await (await fetch('http://localhost:8081/api/v1/auth/me', { headers: { Authorization: `Bearer ${token}` } })).json();
    const orders = await (await fetch(`http://localhost:8081/api/v1/orders/customer/${me.id}`, { headers: { Authorization: `Bearer ${token}` } })).json();
    return orders.filter(o => String(o.description || '').includes('Pipe Leakage Detection & Repair')).sort((a,b) => b.id - a.id)[0];
  });
  out.customerOrder = customerOrder ? { id: customerOrder.id, status: customerOrder.status, description: customerOrder.description } : null;
  if (!customerOrder) throw new Error('Customer order was not found after UI submission');

  const plumberContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const plumber = await plumberContext.newPage();
  plumber.on('console', m => { if (m.type() === 'error') out.consoleErrors.push('plumber:' + m.text()); });
  plumber.on('request', r => { if (/localhost:8081/.test(r.url())) out.requests.push({ app: 'plumber', method: r.method(), url: r.url(), postData: r.url().includes('verify-otp') ? '[redacted]' : (r.postData() || null) }); });
  await plumber.goto('http://localhost:8083/', { waitUntil: 'domcontentloaded' });
  await plumber.getByText('Welcome Back!', { exact: true }).waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  const mobileTab = plumber.getByRole('tab', { name: /mobile number/i });
  if (await mobileTab.count()) await mobileTab.click();
  await plumber.getByLabel('Mobile number').fill('5555500003');
  await plumber.getByRole('button', { name: 'Continue' }).click();
  await plumber.getByRole('button', { name: /Verify & Continue/i }).waitFor({ state: 'visible', timeout: 10000 });
  const pcode = captureOtp('5555500003');
  if (!pcode) throw new Error('Plumber OTP capture unavailable');
  for (let i = 0; i < 6; i++) await plumber.getByLabel(`OTP digit ${i + 1}`).fill(pcode[i]);
  await plumber.getByRole('button', { name: /Verify & Continue/i }).click();
  await plumber.getByText(/DASHBOARD/i).first().waitFor({ state: 'visible', timeout: 15000 });
  let body = await plumber.locator('body').innerText();
  out.plumberInitial = body;
  if (/OFFLINE/i.test(body) && await plumber.getByLabel('Toggle availability').count()) {
    await plumber.getByLabel('Toggle availability').click();
    await plumber.waitForTimeout(800);
    body = await plumber.locator('body').innerText();
  }
  const offer = plumber.getByRole('button', { name: /Pipe Leakage Detection & Repair/ }).first();
  await offer.waitFor({ state: 'visible', timeout: 15000 });
  await offer.click();
  await plumber.getByRole('button', { name: /Accept job offer/i }).click();
  await plumber.waitForTimeout(1000);
  out.plumberAfterAccept = await plumber.locator('body').innerText();
  const postAccept = await customer.evaluate(async (id) => {
    const token = localStorage.getItem('authToken');
    const headers = { Authorization: `Bearer ${token}` };
    const r = await fetch(`http://localhost:8081/api/v1/orders/${id}`, { headers });
    const o = await r.json();
    const c = await fetch(`http://localhost:8081/api/v1/orders/${id}/cancel`, { method: 'PATCH', headers });
    return { detailStatus: r.status, id: o.id, status: o.status, plumberId: o.plumber?.id || null, plumberName: o.plumber?.fullName || null, cancelStatus: c.status };
  }, customerOrder.id);
  out.postAccept = postAccept;
  out.finishedAt = new Date().toISOString();
  await browser.close();
  console.log(JSON.stringify(out, null, 2));
}
main().catch(e => { console.error(JSON.stringify({ error: e.message, stack: e.stack }, null, 2)); process.exitCode = 1; });
