const fs = require('fs');
const path = require('path');
const { chromium } = require('C:/Users/akhil/OneDrive/Desktop/Workspace/fixkart/plumbing-qcommerce/plumbing-qcommerce/admin-portal/node_modules/playwright');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const CUSTOMER_URL = 'http://localhost:8082';
const PLUMBER_URL = 'http://localhost:8083';
const BACKEND_ORIGIN = 'http://localhost:8081';
const OUT = path.resolve(__dirname, '../reports/final-local-regression-20260916/runtime-20260921-targeted');

function routeOf(url) { try { return new URL(url).pathname; } catch { return url; } }
async function click(page, locator) {
  await locator.waitFor({ state: 'visible', timeout: 30000 });
  try { await locator.click({ timeout: 10000 }); }
  catch { await locator.focus(); await page.keyboard.press('Enter'); }
}
function capture(page) {
  const network = [];
  page.on('response', (r) => {
    if (r.url().startsWith(BACKEND_ORIGIN)) network.push({ method: r.request().method(), path: routeOf(r.url()), status: r.status() });
  });
  return network;
}
async function loginCustomer(page, network) {
  await page.goto(CUSTOMER_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1200);
  const phone = page.getByLabel('Mobile number input');
  await phone.fill('9876511223');
  const sendP = page.waitForResponse((r) => routeOf(r.url()) === '/api/v1/auth/send-otp', { timeout: 30000 });
  await click(page, page.getByLabel('Get OTP button'));
  const send = await sendP;
  let code = '';
  try { const b = await send.json(); code = b.qaCode || ''; } catch {}
  const otp = page.getByLabel('OTP input');
  await otp.waitFor({ state: 'visible', timeout: 30000 });
  if (!/^\d{6}$/.test(await otp.inputValue())) await otp.fill(code);
  const verifyP = page.waitForResponse((r) => routeOf(r.url()) === '/api/v1/auth/verify-otp', { timeout: 30000 });
  await click(page, page.getByLabel('Verify and Proceed button'));
  const verify = await verifyP;
  return { sendStatus: send.status(), verifyStatus: verify.status() };
}
async function loginPlumber(page, phone) {
  await page.goto(PLUMBER_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1200);
  const mobile = page.getByRole('textbox', { name: 'Mobile number', exact: true });
  await mobile.waitFor({ state: 'visible', timeout: 30000 });
  await mobile.fill(phone);
  const sendP = page.waitForResponse((r) => routeOf(r.url()) === '/api/v1/auth/send-otp', { timeout: 30000 });
  await click(page, page.getByLabel('Continue'));
  const send = await sendP;
  let code = '';
  try { const b = await send.json(); code = b.qaCode || ''; } catch {}
  const digits = Array.from({ length: 6 }, (_, i) => page.getByLabel(`OTP digit ${i + 1}`));
  for (const d of digits) await d.waitFor({ state: 'visible', timeout: 30000 });
  if (!(await digits[0].inputValue()) && /^\d{6}$/.test(code)) {
    for (let i = 0; i < 6; i++) await digits[i].fill(code[i]);
  }
  const verifyP = page.waitForResponse((r) => routeOf(r.url()) === '/api/v1/auth/verify-otp', { timeout: 30000 });
  await click(page, page.getByLabel('Verify & Continue'));
  const verify = await verifyP;
  await page.getByText('DASHBOARD', { exact: true }).waitFor({ state: 'visible', timeout: 30000 });
  return { sendStatus: send.status(), verifyStatus: verify.status() };
}
async function createCustomerOrder(page) {
  await page.getByLabel('Book Emergency Plumber').waitFor({ state: 'visible', timeout: 30000 }).catch(async () => click(page, page.getByText('Book Emergency Plumber', { exact: true })));
  if (await page.getByLabel('Book Emergency Plumber').isVisible().catch(() => false)) await click(page, page.getByLabel('Book Emergency Plumber'));
  await page.getByText('Book Plumber', { exact: true }).waitFor({ state: 'visible', timeout: 30000 });
  await click(page, page.getByText('Book Plumber', { exact: true }));
  await page.getByText('Proceed to Checkout', { exact: true }).waitFor({ state: 'visible', timeout: 30000 });
  await click(page, page.getByText('Proceed to Checkout', { exact: true }));
  const createP = page.waitForResponse((r) => r.request().method() === 'POST' && routeOf(r.url()) === '/api/v1/orders', { timeout: 30000 });
  await click(page, page.getByLabel('Book and Dispatch Plumber'));
  const response = await createP;
  const body = await response.json();
  return { id: String(body.id), status: body.status, responseStatus: response.status() };
}

(async () => {
  const result = { browser: 'Existing project Playwright + installed Chrome', qa0179: {}, qa0186: {}, errors: [] };
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath: CHROME });

    // QA-0179: authenticated Plumber B uses the real app navigation to open A's private job.
    {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      const page = await context.newPage();
      const network = capture(page);
      await loginPlumber(page, '5555500004');
      await page.evaluate(() => window.navigateScreen('ActiveJob', { jobId: '4' }));
      await page.waitForTimeout(1800);
      result.qa0179.network = network;
      result.qa0179.privateJobDetailStatus = network.find((e) => e.method === 'GET' && e.path === '/api/v1/orders/4')?.status || null;
      result.qa0179.denied = result.qa0179.privateJobDetailStatus === 403 || result.qa0179.privateJobDetailStatus === 404;
      result.qa0179.noMutation = !network.some((e) => ['POST', 'PATCH', 'PUT', 'DELETE'].includes(e.method) && e.path.includes('/orders/4'));
      result.qa0179.body = (await page.locator('body').innerText()).slice(0, 500);
      await page.screenshot({ path: path.join(OUT, 'plumber', 'qa-0179-unauthorized-job.png'), fullPage: true });
      await context.close();
    }

    // QA-0186: a fresh legitimate order is accepted by A, then the unsupported Reject action is attempted.
    {
      const customerContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      const customer = await customerContext.newPage();
      const customerNetwork = capture(customer);
      await loginCustomer(customer, customerNetwork);
      const order = await createCustomerOrder(customer);
      result.qa0186.order = order;
      await customerContext.close();

      const plumberContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      const plumber = await plumberContext.newPage();
      const plumberNetwork = capture(plumber);
      await loginPlumber(plumber, '5555500003');
      const offer = plumber.getByText(`#${order.id}`, { exact: true }).locator('xpath=ancestor::*[@role="button"][1]');
      await offer.waitFor({ state: 'visible', timeout: 30000 });
      await click(plumber, offer);
      const acceptP = plumber.waitForResponse((r) => r.request().method() === 'PATCH' && routeOf(r.url()) === `/api/v1/orders/${order.id}/accept`, { timeout: 30000 });
      await click(plumber, plumber.getByLabel('Accept job offer'));
      const accept = await acceptP;
      result.qa0186.acceptStatus = accept.status();
      await plumber.waitForTimeout(1200);
      await plumber.evaluate((id) => window.navigateScreen('IncomingJobRequest', { jobId: id, customerId: '0', distance: 0 }), order.id);
      await plumber.getByLabel('Reject job offer').waitFor({ state: 'visible', timeout: 30000 });
      const rejectP = plumber.waitForResponse((r) => r.request().method() === 'PATCH' && routeOf(r.url()) === `/api/v1/orders/${order.id}/reject`, { timeout: 30000 });
      await click(plumber, plumber.getByLabel('Reject job offer'));
      const reject = await rejectP;
      result.qa0186.rejectAfterAcceptStatus = reject.status();
      result.qa0186.bounded4xx = reject.status() >= 400 && reject.status() < 500;
      result.qa0186.no500 = reject.status() !== 500;
      result.qa0186.network = plumberNetwork;
      await plumber.screenshot({ path: path.join(OUT, 'plumber', 'qa-0186-reject-after-accept.png'), fullPage: true });
      await plumberContext.close();
    }

    result.status = result.qa0179.denied && result.qa0179.noMutation && result.qa0186.bounded4xx && result.qa0186.no500 ? 'PASS' : 'FAIL';
  } catch (error) {
    result.status = 'FAIL';
    result.failure = String(error && error.stack || error).split('\n').slice(0, 8).join('\n');
  } finally {
    if (browser) await browser.close().catch(() => {});
    fs.writeFileSync(path.join(OUT, 'plumber-followups-result.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify({
      status: result.status,
      failure: result.failure || null,
      qa0179: { detailStatus: result.qa0179.privateJobDetailStatus, denied: result.qa0179.denied, noMutation: result.qa0179.noMutation },
      qa0186: { order: result.qa0186.order || null, acceptStatus: result.qa0186.acceptStatus, rejectAfterAcceptStatus: result.qa0186.rejectAfterAcceptStatus, bounded4xx: result.qa0186.bounded4xx, no500: result.qa0186.no500 },
    }, null, 2));
    process.exitCode = result.status === 'PASS' ? 0 : 1;
  }
})();
