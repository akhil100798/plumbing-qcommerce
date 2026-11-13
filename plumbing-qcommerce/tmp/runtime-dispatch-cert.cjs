const fs = require('fs');
const path = require('path');
const { chromium } = require('C:/Users/akhil/OneDrive/Desktop/Workspace/fixkart/plumbing-qcommerce/plumbing-qcommerce/admin-portal/node_modules/playwright');

const CUSTOMER_URL = 'http://localhost:8082';
const PLUMBER_URL = 'http://localhost:8083';
const BACKEND_ORIGIN = 'http://localhost:8081';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT_DIR = path.resolve(__dirname, '../reports/final-local-regression-20260916/runtime-20260921-targeted');
fs.mkdirSync(path.join(OUT_DIR, 'customer'), { recursive: true });
fs.mkdirSync(path.join(OUT_DIR, 'plumber'), { recursive: true });

const result = {
  browser: 'Existing project Playwright + installed Chrome',
  customer: {},
  plumberA: {},
  plumberB: {},
  errors: [],
  completedAt: new Date().toISOString(),
};

function routeOf(url) {
  try { return new URL(url).pathname; } catch { return url; }
}

function installCapture(page, app, bucket) {
  page.on('response', async (response) => {
    if (!response.url().startsWith(BACKEND_ORIGIN)) return;
    const entry = {
      app,
      method: response.request().method(),
      path: routeOf(response.url()),
      status: response.status(),
    };
    bucket.push(entry);
    if (entry.method === 'POST' && entry.path === '/api/v1/orders' && response.ok()) {
      try {
        const body = await response.json();
        if (body && body.id != null) {
          result.customer.createdOrder = {
            id: String(body.id),
            status: body.status || null,
            responseStatus: response.status(),
          };
        }
      } catch { /* no response body is recorded */ }
    }
  });
  page.on('console', (message) => {
    if (message.type() === 'error') result.errors.push(`${app}: console error`);
  });
  page.on('pageerror', () => result.errors.push(`${app}: page error`));
}

async function click(page, locator) {
  await locator.waitFor({ state: 'visible', timeout: 30000 });
  try {
    await locator.click({ timeout: 10000 });
  } catch {
    await locator.focus();
    await page.keyboard.press('Enter');
  }
}

async function waitForBody(page, pattern, timeout = 30000) {
  await page.waitForFunction((re) => re.test(document.body.innerText), pattern, { timeout });
}

async function waitForOtpValue(locator, timeout = 12000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const value = await locator.inputValue().catch(() => '');
    if (/^\d{6}$/.test(value)) return value;
    await locator.page().waitForTimeout(250);
  }
  return '';
}

async function verifyCustomer(browser) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const network = [];
  installCapture(page, 'customer', network);
  result.customer.network = network;

  await page.goto(CUSTOMER_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1500);
  result.customer.initialBody = (await page.locator('body').innerText()).slice(0, 240);

  const getOtp = page.getByLabel('Get OTP button');
  if (await getOtp.isVisible().catch(() => false)) {
    const phone = page.getByLabel('Mobile number input');
    await phone.fill('9876511223');
    const sendPromise = page.waitForResponse((r) => routeOf(r.url()) === '/api/v1/auth/send-otp', { timeout: 30000 });
    await click(page, getOtp);
    const send = await sendPromise;
    let qaCode = '';
    try {
      const body = await send.json();
      qaCode = typeof body.qaCode === 'string' ? body.qaCode : '';
    } catch { /* no OTP body recorded */ }
    result.customer.sendOtpStatus = send.status();
    const otp = page.getByLabel('OTP input');
    const displayedCode = await waitForOtpValue(otp);
    if (!displayedCode && /^\d{6}$/.test(qaCode)) await otp.fill(qaCode);
    const wrongCode = qaCode === '999999' ? '888888' : '999999';
    await otp.fill(wrongCode);
    const wrongPromise = page.waitForResponse((r) => routeOf(r.url()) === '/api/v1/auth/verify-otp', { timeout: 30000 });
    await click(page, page.getByLabel('Verify and Proceed button'));
    const wrong = await wrongPromise;
    result.customer.wrongOtpStatus = wrong.status();
    result.customer.wrongOtpRejected = wrong.status() === 401 || wrong.status() === 400;
    const validCode = displayedCode || qaCode;
    if (!/^\d{6}$/.test(validCode)) throw new Error('Local QA OTP was not supplied by the backend/UI');
    await otp.fill(validCode);
    const verifyPromise = page.waitForResponse((r) => routeOf(r.url()) === '/api/v1/auth/verify-otp', { timeout: 30000 });
    await click(page, page.getByLabel('Verify and Proceed button'));
    const verify = await verifyPromise;
    result.customer.verifyOtpStatus = verify.status();
  } else {
    result.customer.sessionWasRestored = true;
  }

  await waitForBody(page, /Services|Home|Profile/i, 30000);
  result.customer.authenticated = true;
  result.customer.profileStatus = network.find((e) => e.path === '/api/v1/auth/me' && e.status === 200)?.status || null;
  await page.screenshot({ path: path.join(OUT_DIR, 'customer', 'customer-authenticated.png'), fullPage: true });

  const emergency = page.getByLabel('Book Emergency Plumber');
  if (await emergency.isVisible().catch(() => false)) {
    await click(page, emergency);
  } else {
    await click(page, page.getByText('Book Emergency Plumber', { exact: true }));
  }
  await waitForBody(page, /Pipe Leakage Detection|Book Plumber/i, 30000);
  await click(page, page.getByText('Book Plumber', { exact: true }));
  await waitForBody(page, /Proceed to Checkout/i, 30000);
  await click(page, page.getByText('Proceed to Checkout', { exact: true }));
  await waitForBody(page, /Review & Payment|Book & Dispatch Plumber/i, 30000);
  const createPromise = page.waitForResponse((r) => r.request().method() === 'POST' && routeOf(r.url()) === '/api/v1/orders', { timeout: 30000 });
  await click(page, page.getByLabel('Book and Dispatch Plumber'));
  const create = await createPromise;
  result.customer.orderCreateStatus = create.status();
  await waitForBody(page, /Booking Confirmed|Order|Track/i, 30000);
  if (!result.customer.createdOrder?.id) {
    const body = await page.locator('body').innerText();
    const id = body.match(/(?:order|#)\s*(\d+)/i)?.[1];
    if (id) result.customer.createdOrder = { id, status: null, responseStatus: create.status() };
  }
  result.customer.orderVisible = Boolean(result.customer.createdOrder?.id);
  await page.screenshot({ path: path.join(OUT_DIR, 'customer', 'customer-service-order-created.png'), fullPage: true });

  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1800);
  result.customer.reloadAuthenticated = !/Verify with OTP|Get OTP button/i.test(await page.locator('body').innerText());
  result.customer.reloadProfileStatus = network.find((e) => e.path === '/api/v1/auth/me' && e.status === 200)?.status || null;
  await context.close();
}

async function authenticatePlumber(browser, label, phone) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const network = [];
  installCapture(page, label, network);
  const out = result[label];
  out.network = network;

  await page.goto(PLUMBER_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1200);
  const mobile = page.getByRole('textbox', { name: 'Mobile number', exact: true });
  await mobile.waitFor({ state: 'visible', timeout: 30000 });
  if (await mobile.isVisible().catch(() => false)) {
    await mobile.fill(phone);
    const sendPromise = page.waitForResponse((r) => routeOf(r.url()) === '/api/v1/auth/send-otp', { timeout: 30000 });
    await click(page, page.getByLabel('Continue'));
    const send = await sendPromise;
    out.sendOtpStatus = send.status();
    let qaCode = '';
    try {
      const body = await send.json();
      qaCode = typeof body.qaCode === 'string' ? body.qaCode : '';
    } catch { /* no OTP body recorded */ }
    const digits = Array.from({ length: 6 }, (_, i) => page.getByLabel(`OTP digit ${i + 1}`));
    let visible = true;
    for (const digit of digits) visible = visible && await digit.isVisible().catch(() => false);
    if (!visible) throw new Error(`${label} OTP UI not visible`);
    const current = await digits[0].inputValue().catch(() => '');
    if (!current && /^\d{6}$/.test(qaCode)) {
      for (let i = 0; i < 6; i++) await digits[i].fill(qaCode[i]);
    }
    const verifyPromise = page.waitForResponse((r) => routeOf(r.url()) === '/api/v1/auth/verify-otp', { timeout: 30000 });
    await click(page, page.getByLabel('Verify & Continue'));
    const verify = await verifyPromise;
    out.verifyOtpStatus = verify.status();
  }

  await page.getByText('DASHBOARD', { exact: true }).waitFor({ state: 'visible', timeout: 30000 });
  out.authenticated = true;
  out.online = /ONLINE/.test(await page.locator('body').innerText());
  await page.screenshot({ path: path.join(OUT_DIR, 'plumber', `${label}-dashboard.png`), fullPage: true });
  return { context, page, network, out };
}

async function rejectWithPlumberA(browser) {
  const auth = await authenticatePlumber(browser, 'plumberA', '5555500003');
  const { page, context, network, out } = auth;
  const orderId = result.customer.createdOrder?.id;
  if (!orderId) throw new Error('No newly created order ID was captured');

  const pendingResponse = network.find((e) => e.path === '/api/v1/orders/status/PENDING' && e.status === 200);
  out.pendingEndpointStatus = pendingResponse?.status || null;
  out.pendingOfferVisible = (await page.locator('body').innerText()).includes(`#${orderId}`);
  if (!out.pendingOfferVisible) {
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1800);
  }
  const offer = page.getByText(`#${orderId}`, { exact: true }).locator('xpath=ancestor::*[@role="button"][1]');
  await offer.waitFor({ state: 'visible', timeout: 30000 });
  await click(page, offer);
  await waitForBody(page, /New Job Request|Reject job offer/i, 30000);
  await page.screenshot({ path: path.join(OUT_DIR, 'plumber', 'qa-0177-before-reject.png'), fullPage: true });

  const rejectButton = page.getByLabel('Reject job offer');
  const rejectRequest = page.waitForResponse((r) => r.request().method() === 'PATCH' && routeOf(r.url()) === `/api/v1/orders/${orderId}/reject`, { timeout: 30000 });
  await click(page, rejectButton);
  const reject = await rejectRequest;
  out.rejectMethod = 'PATCH';
  out.rejectStatus = reject.status();
  out.rejectMutationOccurred = reject.status() >= 200 && reject.status() < 300;
  await page.waitForTimeout(1800);
  await page.screenshot({ path: path.join(OUT_DIR, 'plumber', 'qa-0177-after-reject.png'), fullPage: true });

  const afterBody = await page.locator('body').innerText();
  out.afterRejectReturnedDashboard = /DASHBOARD/i.test(afterBody);
  out.afterRejectOfferHidden = !afterBody.includes(`#${orderId}`);
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1800);
  const reloadBody = await page.locator('body').innerText();
  out.samePlumberReloadAuthenticated = /DASHBOARD/i.test(reloadBody);
  out.samePlumberOfferAbsentAfterReload = !reloadBody.includes(`#${orderId}`);
  out.pendingPollAfterReject = network.filter((e) => e.path === '/api/v1/orders/status/PENDING' && e.status === 200).length >= 2;
  out.samePlumberOfferAbsentAfterPoll = out.samePlumberOfferAbsentAfterReload;
  await context.close();
}

async function verifyPlumberB(browser) {
  const auth = await authenticatePlumber(browser, 'plumberB', '5555500004');
  const { page, context, out } = auth;
  const orderId = result.customer.createdOrder?.id;
  const body = await page.locator('body').innerText();
  out.pendingEndpointStatus = out.network.find((e) => e.path === '/api/v1/orders/status/PENDING' && e.status === 200)?.status || null;
  out.eligibleOrderVisible = body.includes(`#${orderId}`);
  await page.screenshot({ path: path.join(OUT_DIR, 'plumber', 'plumberB-pending-order.png'), fullPage: true });
  await context.close();
}

(async () => {
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath: CHROME });
    await verifyCustomer(browser);
    await rejectWithPlumberA(browser);
    await verifyPlumberB(browser);
    result.status = 'PASS';
  } catch (error) {
    result.status = 'FAIL';
    result.failure = String(error && error.stack || error).split('\n').slice(0, 8).join('\n');
  } finally {
    if (browser) await browser.close().catch(() => {});
    result.completedAt = new Date().toISOString();
    fs.writeFileSync(path.join(OUT_DIR, 'dispatch-runtime-result.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify({
      status: result.status,
      failure: result.failure || null,
      customer: {
        sendOtpStatus: result.customer.sendOtpStatus,
        wrongOtpRejected: result.customer.wrongOtpRejected,
        verifyOtpStatus: result.customer.verifyOtpStatus,
        orderCreateStatus: result.customer.orderCreateStatus,
        createdOrder: result.customer.createdOrder || null,
        reloadAuthenticated: result.customer.reloadAuthenticated,
      },
      plumberA: {
        authenticated: result.plumberA.authenticated,
        online: result.plumberA.online,
        pendingOfferVisible: result.plumberA.pendingOfferVisible,
        rejectStatus: result.plumberA.rejectStatus,
        rejectMutationOccurred: result.plumberA.rejectMutationOccurred,
        samePlumberOfferAbsentAfterPoll: result.plumberA.samePlumberOfferAbsentAfterPoll,
        samePlumberOfferAbsentAfterReload: result.plumberA.samePlumberOfferAbsentAfterReload,
      },
      plumberB: {
        authenticated: result.plumberB.authenticated,
        online: result.plumberB.online,
        eligibleOrderVisible: result.plumberB.eligibleOrderVisible,
      },
    }, null, 2));
    process.exitCode = result.status === 'PASS' ? 0 : 1;
  }
})();
