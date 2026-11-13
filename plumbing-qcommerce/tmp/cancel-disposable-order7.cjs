const { chromium } = require('playwright');
const crypto = require('crypto');
const childProcess = require('child_process');

const BASE = 'http://localhost:8081/api/v1';
const PHONE = '5555500002';
function otpKey(phone) {
  return 'local-staging:otp:' + crypto.createHash('sha256').update(phone.replace(/\D/g, '')).digest('hex');
}
function captureOtp(phone) {
  try {
    return childProcess.execFileSync('C:\\Program Files\\Redis\\redis-cli.exe', ['-h', '127.0.0.1', '-p', '6379', '--raw', 'GET', otpKey(phone)], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { return ''; }
}
async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('http://localhost:8082/', { waitUntil: 'domcontentloaded' });
  await page.getByText('Skip', { exact: true }).waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  const input = page.getByRole('textbox').first();
  await input.fill(PHONE);
  await page.getByRole('button', { name: /Get OTP/i }).click();
  await page.getByRole('button', { name: /Verify and Proceed/i }).waitFor({ state: 'visible', timeout: 10000 });
  const otp = captureOtp(PHONE);
  if (!otp) throw new Error('OTP capture unavailable');
  await page.getByRole('textbox').first().fill(otp);
  await page.getByRole('button', { name: /Verify and Proceed/i }).click();
  await page.getByText('HOME', { exact: true }).waitFor({ state: 'visible', timeout: 15000 });
  const result = await page.evaluate(async () => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken') || localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const detailResponse = await fetch('http://localhost:8081/api/v1/orders/7', { headers });
    const detailText = await detailResponse.text();
    let detail; try { detail = JSON.parse(detailText); } catch { detail = null; }
    const out = { detailStatus: detailResponse.status, detail: detail ? { id: detail.id, status: detail.status, description: detail.description, customerId: detail.customer?.id || detail.customerId || null, plumberId: detail.plumber?.id || null } : null };
    if (detailResponse.ok && detail && detail.status === 'PENDING') {
      const cancelResponse = await fetch('http://localhost:8081/api/v1/orders/7/cancel', { method: 'PATCH', headers });
      out.cancelStatus = cancelResponse.status;
      const afterResponse = await fetch('http://localhost:8081/api/v1/orders/7', { headers });
      const after = afterResponse.ok ? await afterResponse.json() : null;
      out.after = after ? { id: after.id, status: after.status } : null;
    }
    return out;
  });
  console.log(JSON.stringify(result));
  await browser.close();
}
main().catch(error => { console.error(JSON.stringify({ error: error.message })); process.exitCode = 1; });
