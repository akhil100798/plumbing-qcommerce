const { chromium } = require('playwright');
const crypto = require('crypto');
const childProcess = require('child_process');
const PHONE = '5555500002';
function otpKey(phone) { return 'local-staging:otp:' + crypto.createHash('sha256').update(phone.replace(/\D/g, '')).digest('hex'); }
function otp(phone) { try { return childProcess.execFileSync('C:\\Program Files\\Redis\\redis-cli.exe', ['-h','127.0.0.1','-p','6379','--raw','GET',otpKey(phone)], { encoding:'utf8', stdio:['ignore','pipe','ignore'] }).trim(); } catch { return ''; } }
async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const requests = [];
  page.on('request', req => { if (req.url().includes('localhost:8081')) requests.push({ method: req.method(), path: new URL(req.url()).pathname, status: null }); });
  page.on('response', res => { const item = requests.findLast(x => x.path === new URL(res.url()).pathname && x.status === null); if (item) item.status = res.status(); });
  await page.goto('http://localhost:8082/', { waitUntil:'domcontentloaded' });
  await page.getByText('Skip', { exact:true }).waitFor({ state:'visible', timeout:10000 }).catch(() => {});
  await page.getByRole('textbox').first().fill(PHONE);
  await page.getByRole('button', { name:/Get OTP/i }).click();
  await page.getByRole('button', { name:/Verify and Proceed/i }).waitFor({ state:'visible', timeout:10000 });
  const code = otp(PHONE); if (!code) throw new Error('OTP capture unavailable');
  await page.getByRole('textbox').first().fill(code);
  await page.getByRole('button', { name:/Verify and Proceed/i }).click();
  await page.getByText('HOME', { exact:true }).waitFor({ state:'visible', timeout:15000 });
  const initial = { url: page.url(), buttons: await page.getByRole('button').allTextContents(), body: (await page.locator('body').innerText()).slice(0,4000) };
  const apiData = await page.evaluate(async () => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken') || localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    async function get(path) { const r = await fetch('http://localhost:8081/api/v1' + path, { headers }); const text = await r.text(); let body; try { body = JSON.parse(text); } catch { body = null; } return { status:r.status, body }; }
    const me = await get('/auth/me');
    const addresses = await get('/users/me/addresses');
    const orders = me.body?.id ? await get('/orders/customer/' + me.body.id) : { status:0, body:[] };
    const details = [];
    for (const order of (Array.isArray(orders.body) ? orders.body : [])) {
      const detail = await get('/orders/' + order.id);
      const rating = await get('/orders/' + order.id + '/rating');
      details.push({ id:order.id, status:order.status, description:order.description, detailStatus:detail.status, detail: detail.body ? { id:detail.body.id, status:detail.body.status, rating:detail.body.rating ?? null, ratingComment:detail.body.ratingComment ?? null } : null, ratingStatus:rating.status, ratingBody:rating.body });
    }
    return { me: me.body ? { id:me.body.id, fullName:me.body.fullName, phone:me.body.phone, role:me.body.role, profileComplete:me.body.profileComplete } : null, addresses: { status:addresses.status, count:Array.isArray(addresses.body)?addresses.body.length:null }, orders: details };
  });
  let profile = null;
  const profileButton = page.getByText('Profile', { exact:true }).last();
  if (await profileButton.count()) {
    await profileButton.click();
    await page.waitForTimeout(500);
    profile = { buttons: await page.getByRole('button').allTextContents(), body: (await page.locator('body').innerText()).slice(0,5000), textboxes: await page.getByRole('textbox').count(), inputs: await page.locator('input').count() };
  }
  console.log(JSON.stringify({ initial, apiData, profile, requestPaths: requests.filter(x => x.path.includes('profile') || x.path.includes('users/me') || x.path.includes('rating') || x.path.includes('/orders')) }));
  await browser.close();
}
main().catch(err => { console.error(JSON.stringify({ error: err.message })); process.exitCode = 1; });
