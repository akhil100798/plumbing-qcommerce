const { chromium } = require('playwright');
const crypto = require('crypto');
const childProcess = require('child_process');
const PHONE = '5555500001';
const SENTINEL = '<qa-address-test>';
const FLAT = SENTINEL;
const AREA = 'Certification Address Area';
function key(p) { return 'local-staging:otp:' + crypto.createHash('sha256').update(p.replace(/\D/g, '')).digest('hex'); }
function otp(p) { try { return childProcess.execFileSync('C:\\Program Files\\Redis\\redis-cli.exe', ['-h','127.0.0.1','-p','6379','--raw','GET',key(p)], {encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim(); } catch { return ''; } }
async function login(page) {
  await page.goto('http://localhost:8082/', { waitUntil:'domcontentloaded' });
  await page.getByText('Skip', { exact:true }).waitFor({ state:'visible', timeout:10000 }).catch(()=>{});
  await page.getByRole('textbox').first().fill(PHONE);
  await page.getByRole('button', { name:/Get OTP/i }).click();
  await page.getByRole('button', { name:/Verify and Proceed/i }).waitFor({ state:'visible', timeout:10000 });
  const code = otp(PHONE); if (!code) throw Error('OTP unavailable');
  await page.getByRole('textbox').first().fill(code);
  await page.getByRole('button', { name:/Verify and Proceed/i }).click();
  await page.getByText('HOME', { exact:true }).waitFor({ state:'visible', timeout:15000 });
}
async function openAddresses(page) {
  await page.getByText('Profile', { exact:true }).last().click();
  await page.getByText('Saved Addresses & Locations', { exact:true }).click();
  await page.getByText('Saved Addresses', { exact:true }).waitFor({ state:'visible', timeout:10000 });
}
async function main() {
  console.log('step:launch');
  const browser = await chromium.launch({ headless:true });
  const context = await browser.newContext({ viewport:{width:390,height:844} });
  const page = await context.newPage();
  const dialogs = []; page.on('dialog', d => { dialogs.push(d.type()); d.dismiss().catch(()=>{}); });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await login(page); console.log('step:logged-in'); await openAddresses(page); console.log('step:addresses');
  const before = (await page.locator('body').innerText()).slice(0,5000);
  await page.getByRole('button', { name:'Add New Service Address' }).click(); console.log('step:modal');
  const inputs = page.locator('input');
  console.log('inputs:' + await inputs.count());
  await inputs.nth(0).fill(FLAT);
  await inputs.nth(1).fill(AREA);
  await inputs.nth(2).fill('Bengaluru');
  await inputs.nth(3).fill('560102');
  console.log('step:filling'); await page.getByText('Save Address', { exact:true }).click(); console.log('step:saved-click');
  await page.waitForTimeout(1500);
  const afterCreate = await page.locator('body').innerText();
  const addressResponseSummary = await page.evaluate(() => performance.getEntriesByType('resource').map(e => e.name).filter(n => n.includes('/users/me/addresses')).slice(-5));
  if (!afterCreate.includes(SENTINEL)) {
    console.log(JSON.stringify({ stage:'create-failed', body:afterCreate.slice(0,5000), addressResponseSummary, dialogs, errors }));
    await browser.close();
    return;
  }
  const createDom = await page.evaluate((sentinel) => ({
    bodyHasSentinel: document.body.innerText.includes(sentinel),
    encodedHtml: document.body.innerHTML.includes('&lt;qa-address-test&gt;'),
    rawScriptTag: Array.from(document.scripts).some(s => s.textContent?.includes('qa-address-test')),
    sentinelElements: Array.from(document.querySelectorAll('*')).filter(el => el.childElementCount === 0 && el.textContent === sentinel).length,
  }), SENTINEL);
  const created = await page.evaluate(async (sentinel) => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken') || localStorage.getItem('token');
    const r = await fetch('http://localhost:8081/api/v1/users/me/addresses', { headers:{ Authorization:`Bearer ${token}` } });
    const list = r.ok ? await r.json() : [];
    const match = Array.isArray(list) ? list.find(a => String(a.addressLine || '').includes(sentinel)) : null;
    return match ? { id:match.id, addressLine:match.addressLine, label:match.label } : null;
  }, SENTINEL);

  await page.getByText('Profile', { exact:true }).last().click().catch(()=>{});
  await page.getByRole('button', { name:'Log Out' }).click();
  await page.waitForTimeout(500);
  await login(page); await openAddresses(page);
  await page.getByText(SENTINEL, { exact:true }).waitFor({ state:'visible', timeout:10000 });
  const afterRelogin = await page.locator('body').innerText();
  const reloginDom = await page.evaluate((sentinel) => ({
    bodyHasSentinel: document.body.innerText.includes(sentinel),
    encodedHtml: document.body.innerHTML.includes('&lt;qa-address-test&gt;'),
    rawScriptTag: Array.from(document.scripts).some(s => s.textContent?.includes('qa-address-test')),
  }), SENTINEL);
  let deleteStatus = null;
  if (created?.id) {
    deleteStatus = await page.evaluate(async (id) => {
      const token = localStorage.getItem('authToken') || localStorage.getItem('accessToken') || localStorage.getItem('token');
      const r = await fetch('http://localhost:8081/api/v1/users/me/addresses/' + id, { method:'DELETE', headers:{ Authorization:`Bearer ${token}` } });
      return r.status;
    }, created.id);
  }
  console.log(JSON.stringify({ before, created, createDom, afterRelogin: afterRelogin.includes(SENTINEL), reloginDom, deleteStatus, dialogs, errors }));
  await browser.close();
}
main().catch(e=>{ console.error(JSON.stringify({error:e.message})); process.exitCode=1; });
