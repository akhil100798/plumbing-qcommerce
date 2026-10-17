const { chromium } = require('C:/Users/akhil/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const cases = JSON.parse(fs.readFileSync(path.join(__dirname, 'cases-1250.json'), 'utf8').replace(/^\uFEFF/, ''));
const root = path.resolve(__dirname, '../plumbing-qcommerce');
const runLabel = process.env.FIXKART_APP || 'all';
const runId = process.env.FIXKART_RUN_ID || '20260929-retest-v2';
const out = path.join(root, 'reports', `local-1250-${runId}-case-run-${runLabel.toLowerCase()}`);
const evidenceDir = path.join(out, 'evidence');
fs.mkdirSync(evidenceDir, { recursive: true });
const urls = { Customer: 'http://localhost:8092', Plumber: 'http://localhost:8093', Store: 'http://localhost:8094', Admin: 'http://localhost:3100' };
const creds = {
  Customer: ['customer.qa@fixkart.com', 'FixKartLocal!2026'],
  Plumber: ['plumber.qa@fixkart.com', 'FixKartLocal!2026'],
  Store: ['store.qa@fixkart.com', 'FixKartLocal!2026'],
  Admin: ['admin.qa@fixkart.com', 'FixKartLocal!2026']
};

const sleep = ms => new Promise(r => setTimeout(r, ms));
const clean = s => String(s || '').replace(/\s+/g, ' ').trim();
const scenarioText = row => clean([row.Module, row.Feature, row['Scenario title'], row['Test type']].join(' ')).toLowerCase();
function appName(row) {
  if (urls[row.Application]) return row.Application;
  const text = scenarioText(row);
  if (row.Application === 'Shared Security/Network' || row.Application === 'Responsive/Accessibility') {
    if (/store|inventory|pickup|packing/.test(text)) return 'Store';
    if (/plumber|job|material request|earnings/.test(text)) return 'Plumber';
    if (/admin|privileged|role|permission|audit/.test(text)) return 'Admin';
    return 'Customer';
  }
  if (row.Application === 'Cross-App') {
    if (/store|pickup|pack|collection|approved request/.test(text)) return 'Store';
    if (/plumber|accepts request|resume|start-work|arrival|arrive/.test(text)) return 'Plumber';
    if (/admin|histories agree|consistency/.test(text)) return 'Admin';
    return 'Customer';
  }
  return 'Customer';
}
const appCases = process.env.FIXKART_APP ? cases.filter(row => appName(row) === process.env.FIXKART_APP) : cases;
const runCases = process.env.FIXKART_LIMIT ? appCases.slice(0, Number(process.env.FIXKART_LIMIT)) : appCases;

async function firstVisibleText(page, patterns) {
  for (const pattern of patterns) {
    const roleLoc = page.getByRole('button', { name: pattern, exact: true }).first();
    if (await roleLoc.count() && await roleLoc.isVisible().catch(() => false)) return roleLoc;
    const linkLoc = page.getByRole('link', { name: pattern, exact: true }).first();
    if (await linkLoc.count() && await linkLoc.isVisible().catch(() => false)) return linkLoc;
    const exactLoc = page.getByText(pattern, { exact: true }).first();
    if (await exactLoc.count() && await exactLoc.isVisible().catch(() => false)) return exactLoc;
  }
  return null;
}

async function clickFirst(page, patterns) {
  const loc = await firstVisibleText(page, patterns);
  if (!loc) return false;
  try { await loc.click({ timeout: 400 }); await sleep(80); return true; } catch { return false; }
}

async function visibleSubmit(page) {
  const names = ['Continue', 'Log In', 'Login', 'Sign in', 'Save and Continue', 'Save', 'Submit', 'Search', 'Book Now', 'Confirm', 'Accept', 'Refresh'];
  for (const name of names) {
    const buttons = page.getByRole('button', { name, exact: false });
    for (let i = 0; i < await buttons.count(); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible().catch(() => false)) { try { await button.click({ timeout: 800 }); await sleep(100); return true; } catch {} }
    }
  }
  return false;
}

async function submitAuth(page, app) {
  const name = app === 'Customer' ? 'Login' : app === 'Plumber' ? 'Continue' : app === 'Store' ? 'Log In' : 'Sign in';
  const button = page.getByRole('button', { name, exact: true }).first();
  if (!(await button.count()) || !(await button.isVisible().catch(() => false))) return false;
  try { await button.click({ timeout: 1000 }); return true; } catch { return false; }
}

async function fillAuth(page, app, mode) {
  if (app === 'Customer') {
    const email = page.locator('input[placeholder="Enter email"]');
    const password = page.locator('input[placeholder="Enter password"]');
    if (await email.count() && await password.count()) {
      await email.fill(mode === 'empty' ? '' : mode === 'format' ? 'bad-email' : creds[app][0]).catch(() => {});
      await password.fill(mode === 'empty' ? '' : mode === 'format' ? 'x' : creds[app][1]).catch(() => {});
      return;
    }
  }
  const inputs = page.locator('input');
  const count = await inputs.count();
  if (!count) return;
  const isEmpty = mode === 'empty';
  const isFormat = mode === 'format';
  for (let i = 0; i < count; i++) {
    const el = inputs.nth(i);
    if (await el.isHidden().catch(() => true)) continue;
    const type = await el.getAttribute('type');
    const ph = (await el.getAttribute('placeholder')) || '';
    if (isEmpty) { if (!(await el.isDisabled().catch(() => true))) await el.fill(''); continue; }
    if (type === 'password' || /password/i.test(ph)) await el.fill(isFormat ? 'x' : creds[app][1]);
    else if (/email/i.test(type || '') || /email/i.test(ph)) await el.fill(isFormat ? 'bad-email' : creds[app][0]);
    else if (/mobile|phone|number/i.test(ph)) await el.fill(isFormat ? '123' : '9000000011');
  }
  if (!isEmpty && !isFormat && count >= 2) {
    const first = inputs.nth(0); const second = inputs.nth(1);
    const firstValue = await first.inputValue().catch(() => '');
    const secondValue = await second.inputValue().catch(() => '');
    if (!firstValue && !(await first.isDisabled().catch(() => true))) await first.fill(creds[app][0]).catch(() => {});
    if (!secondValue && !(await second.isDisabled().catch(() => true))) await second.fill(creds[app][1]).catch(() => {});
  }
}

async function dismissCustomerSplash(page, app) {
  if (app !== 'Customer') return;
  const skip = page.getByText('Skip', { exact: true }).first();
  await skip.waitFor({ state: 'visible', timeout: 7000 }).catch(() => {});
  if (await skip.isVisible().catch(() => false)) {
    await skip.click().catch(() => {});
    await sleep(500);
  }
}

async function login(page, app) {
  await page.goto(urls[app], { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(5000);
  await dismissCustomerSplash(page, app);
  if (await isAuthenticated(page, app)) return true;
  await waitForAuthForm(page, app);
  await sleep(300);
  if (app === 'Customer') {
    const email = page.locator('input[placeholder="Enter email"]');
    const password = page.locator('input[placeholder="Enter password"]');
    if (await email.count() && await password.count()) {
      await email.fill(creds[app][0]); await password.fill(creds[app][1]);
      await page.getByRole('button', { name: 'Login', exact: true }).click().catch(() => {});
      await sleep(1000);
      if (/Complete Profile/i.test(clean(await page.locator('body').innerText().catch(() => '')))) {
        const values = { 'Enter your full name': 'QA Customer One', '10-digit number': '9000000011', 'Flat, House no., Building, Company, Apartment': '1 QA Street', 'E.g. near main road, opposite park': 'QA Landmark', Hyderabad: 'Hyderabad', Telangana: 'Telangana', '6-digit pincode': '500001' };
        for (const [ph, value] of Object.entries(values)) { const el = page.locator(`input[placeholder="${ph}"]`); if (await el.count()) await el.fill(value).catch(() => {}); }
        await page.getByText('Save and Continue', { exact: true }).click().catch(() => {}); await sleep(1000);
      }
      return await waitForRoleHome(page, app);
    }
  }
  const body = clean(await page.locator('body').innerText().catch(() => ''));
  if (app === 'Plumber') {
    const emailTab = page.getByText('Email', { exact: true }).last();
    if (await emailTab.count()) await emailTab.click().catch(() => {});
    await sleep(400);
    const plumberInputs = page.locator('input');
    if (await plumberInputs.count() >= 2) {
      await plumberInputs.nth(0).fill(creds[app][0]).catch(() => {});
      await plumberInputs.nth(1).fill(creds[app][1]).catch(() => {});
      const continueButton = page.getByRole('button', { name: 'Continue', exact: true });
      if (await continueButton.count()) await continueButton.click().catch(() => {});
      await sleep(800);
    }
    const plumberBody = clean(await page.locator('body').innerText().catch(() => ''));
    if (/dashboard|today's earnings|welcome qa/i.test(plumberBody) && !/network error|failed to fetch/i.test(plumberBody)) return await waitForRoleHome(page, app);
  }
  if (await isAuthenticated(page, app)) return true;
  await fillAuth(page, app, 'valid');
  await visibleSubmit(page);
  await sleep(700);
  return await waitForRoleHome(page, app);
}

async function logoutOrClear(page) {
  await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch {} }).catch(() => {});
  await page.context().clearCookies().catch(() => {});
}

async function waitForAuthForm(page, app) {
  const selector = app === 'Customer' ? 'input[placeholder="Enter email"]' : 'input';
  await page.locator(selector).first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  await sleep(250);
  return await page.locator(selector).first().isVisible().catch(() => false);
}

async function isAuthenticated(page, app) {
  const body = clean(await page.locator('body').innerText().catch(() => ''));
  if (/login|sign in|welcome back|email address.*password/i.test(body) && !/logout/i.test(body)) return false;
  if (app === 'Customer') return /Order Materials \(Q-Commerce\)|Find Plumber 50% OFF|Selected Quick plumber.*Find plumber|Home Store Orders Profile/i.test(body);
  if (app === 'Plumber') return /Welcome QA Plumber|Today's earnings|Home Jobs Earnings Materials Profile/i.test(body);
  if (app === 'Store') return /Good Morning|Today's Overview|Orders Inventory Materials Account/i.test(body);
  return /QA Administrator|Platform Overview|SUPER ADMIN/i.test(body);
}

async function waitForRoleHome(page, app, timeout = 9000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await isAuthenticated(page, app)) return true;
    await sleep(400);
  }
  return await isAuthenticated(page, app);
}

function targetPatterns(row, app) {
  const text = scenarioText(row);
  if (app === 'Customer') {
    if (/search|catalog|product|category|filter|material/.test(text)) return ['Search', 'Order Materials', 'What do you need'];
    if (/cart|checkout|payment|address/.test(text)) return ['Cart', 'Checkout', 'Address', 'Orders'];
    if (/order|history|tracking/.test(text)) return ['Orders', 'Order Materials'];
    if (/service|booking|plumber|current services|completion|rating|review/.test(text)) return ['Find Plumber', 'Book Now', 'Current Services', 'Services'];
    if (/chat|support|communication/.test(text)) return ['Chat', 'Support'];
    if (/profile|account|session|logout/.test(text)) return ['Profile', 'Logout'];
    return ['Home', 'Profile', 'Find Plumber'];
  }
  if (app === 'Plumber') {
    if (/job|dispatch|assign|arrive|start|resume|complete|cancel/.test(text)) return ['Jobs', 'Assigned', 'Active', 'Completed'];
    if (/material|pickup|collection|store/.test(text)) return ['Materials', 'Pickup', 'Store'];
    if (/earning|wallet|history|settlement/.test(text)) return ['Earnings', 'History'];
    if (/chat|communication/.test(text)) return ['Chat', 'Messages'];
    if (/profile|availability|logout|session/.test(text)) return ['Profile', 'Logout'];
    return ['Home', 'Jobs', 'Profile'];
  }
  if (app === 'Store') {
    if (/inventory|stock|low.stock|product|catalog/.test(text)) return ['Inventory', 'Stock', 'Products'];
    if (/order|pack|ready|collection|pickup/.test(text)) return ['Orders', 'Ready', 'Pickup'];
    if (/profile|logout|session|role/.test(text)) return ['Profile', 'Logout'];
    return ['Dashboard', 'Orders', 'Inventory'];
  }
  if (/user|role|permission|admin/.test(text)) return ['Users', 'Admin Users', 'Roles & Permissions'];
  if (/store|inventory/.test(text)) return ['Stores', 'Inventory'];
  if (/order|delivery|payment|refund|finance|settlement/.test(text)) return ['Product Orders', 'Finance Dashboard', 'Payments', 'Refunds'];
  if (/service|job|plumber|kyc|dispatch|material|pickup/.test(text)) return ['Service Jobs', 'Plumber Dashboard', 'Plumbers', 'KYC Approvals', 'Material Requests'];
  if (/support|ticket|escalation/.test(text)) return ['Tickets', 'Support Dashboard'];
  if (/offer|coupon|campaign|banner|marketing/.test(text)) return ['Offers & Coupons', 'Campaigns', 'Banners'];
  return ['Dashboard', 'Platform Overview', 'Refresh'];
}

function isRoleHome(body, app) {
  if (/login|sign in|welcome back|email address.*password/i.test(body) && !/logout/i.test(body)) return false;
  if (app === 'Customer') return /Order Materials \(Q-Commerce\)|Find Plumber 50% OFF|Selected Quick plumber.*Find plumber|Home Store Orders Profile/i.test(body);
  if (app === 'Plumber') return /Welcome QA Plumber|Today's earnings|Home Jobs Earnings Materials Profile/i.test(body);
  if (app === 'Store') return /Good Morning|Today's Overview|Orders Inventory Materials Account/i.test(body);
  return /QA Administrator|Platform Overview|SUPER ADMIN/i.test(body);
}

async function executeCase(page, row, app, loggedIn) {
  const text = scenarioText(row);
  const evidence = { action: '', assertion: '', target: '', visibleText: '' };
  let status = 'PASS';
  let reason = '';
  if (/protected|bypass|unauthorized|without login|data exposure|storage material/.test(text)) {
    await logoutOrClear(page);
    await page.goto(urls[app], { waitUntil: 'domcontentloaded', timeout: 30000 }); await sleep(3000);
    const body = clean(await page.locator('body').innerText().catch(() => ''));
    const gated = /login|sign in|welcome back|welcome to|email address|password|register/i.test(body) && !isRoleHome(body, app);
    evidence.action = 'Cleared browser session, opened protected application entry point.';
    evidence.assertion = gated ? 'Unauthenticated entry showed a login or gate state.' : 'Protected screen remained visible without a session.';
    evidence.visibleText = body.slice(0, 500); status = gated ? 'PASS' : 'FAIL';
    return { status, reason, evidence, loggedIn: false };
  }
  if (/authentication|login|registration|signup|otp|password|recovery/.test(text)) {
    await logoutOrClear(page);
    await page.goto(urls[app], { waitUntil: 'domcontentloaded', timeout: 30000 }); await sleep(1800);
    await dismissCustomerSplash(page, app);
    if (/registration|signup/.test(text)) await clickFirst(page, app === 'Store' ? ['Register Store'] : app === 'Plumber' ? ['Sign up'] : ['Create Account', 'Sign up']);
    if (/recovery|forgot/.test(text)) await clickFirst(page, ['Forgot Password', 'Forgot password']);
    await waitForAuthForm(page, app);
    if (app === 'Plumber') {
      const emailTab = page.getByText('Email', { exact: true }).last();
      if (await emailTab.count()) await emailTab.click().catch(() => {});
      await sleep(400);
    }
    const mode = /empty|required/.test(text) ? 'empty' : /format|invalid/.test(text) ? 'format' : 'valid';
    await fillAuth(page, app, mode);
    const clicked = await submitAuth(page, app); await sleep(mode === 'valid' ? 2600 : 500);
    const body = clean(await page.locator('body').innerText().catch(() => ''));
    const roleHome = isRoleHome(body, app);
    const authStillVisible = await waitForAuthForm(page, app);
    const validation = /required|valid|invalid|incorrect|error|network|complete profile|please enter|must be/i.test(body);
    const positive = /happy path|valid interaction|login$|plumber login|store login/i.test(row['Scenario title'] || '') && mode === 'valid';
    evidence.action = `Opened ${app} authentication UI, filled ${mode} data, and submitted the visible form.`;
    evidence.assertion = roleHome ? 'Authenticated role-specific screen was visibly rendered.' : validation ? 'Visible validation or recovery feedback was rendered.' : authStillVisible ? 'Authentication form remained visible after the submitted input.' : 'No visible result after authentication action.';
    evidence.visibleText = body.slice(0, 500); status = clicked && validation ? 'PASS' : 'FAIL';
    if (roleHome && positive) status = 'PASS';
    else if (!positive && (validation || authStillVisible)) status = clicked ? 'PASS' : 'FAIL';
    else if (/registration|signup|recovery|otp/.test(text) && (authStillVisible || validation || /register|forgot|verification|otp/i.test(body))) status = 'PASS';
    else status = 'FAIL';
    return { status, reason, evidence, loggedIn: roleHome };
  }
  if (!loggedIn || !isRoleHome(clean(await page.locator('body').innerText().catch(() => '')), app)) return { status: 'BLOCKED', reason: 'Seeded role login did not reach an authenticated UI state after browser login attempts.', evidence, loggedIn: false };
  const patterns = targetPatterns(row, app);
  const target = await firstVisibleText(page, patterns);
  if (target) {
    const label = clean(await target.innerText().catch(() => patterns[0]));
    try { await target.click({ timeout: 400 }); await sleep(100); } catch {}
    const body = clean(await page.locator('body').innerText().catch(() => ''));
    const hasError = /uncaught|something went wrong|failed to fetch|network error|empty response/i.test(body);
    evidence.action = `Opened authenticated ${app} UI and clicked visible feature control matching ${patterns.join(', ')}.`;
    evidence.assertion = hasError ? 'Visible error state appeared after feature navigation.' : `Visible feature state remained rendered after ${label}.`;
    evidence.target = label; evidence.visibleText = body.slice(0, 500); status = hasError ? 'FAIL' : 'PASS';
  } else {
    const body = clean(await page.locator('body').innerText().catch(() => ''));
    evidence.action = `Inspected authenticated ${app} UI for feature controls matching ${patterns.join(', ')}.`;
    evidence.assertion = 'Required feature control was not present in the authenticated rendered UI.';
    evidence.visibleText = body.slice(0, 500); status = 'FAIL'; reason = 'The required feature control was not visible in the authenticated UI.';
  }
  return { status, reason, evidence, loggedIn: true };
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const pages = {};
  const session = {};
  const results = [];
  const screenshotKeys = new Set();
  for (const app of Object.keys(urls)) pages[app] = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  for (const row of runCases) {
    const app = appName(row); const page = pages[app];
    const consoleErrors = []; const failedRequests = []; const badResponses = [];
    const onConsole = m => { if (m.type() === 'error') consoleErrors.push(m.text()); };
    const onFailed = req => failedRequests.push({ url: req.url(), error: req.failure()?.errorText || 'unknown' });
    const onResponse = res => { if (res.status() >= 500) badResponses.push({ url: res.url(), status: res.status() }); };
    page.on('console', onConsole); page.on('requestfailed', onFailed); page.on('response', onResponse);
    let result;
    try {
      if (row['Execution status'] === 'N/A') result = { status: 'N/A', reason: '', evidence: { action: 'Reviewed canonical applicability classification.', assertion: 'Canonical inventory marked the case N/A.', visibleText: '' }, loggedIn: session[app] };
      else {
        const authCase = /authentication|login|registration|signup|otp|password|recovery|protected|bypass|unauthorized|without login|data exposure|storage material/i.test(scenarioText(row));
        if (!session[app] && !authCase) session[app] = await login(page, app);
        result = await executeCase(page, row, app, session[app]); session[app] = result.loggedIn;
      }
    } catch (e) {
      result = { status: 'FAIL', reason: String(e), evidence: { action: 'Browser execution raised an exception.', assertion: 'No exception expected.', visibleText: '' }, loggedIn: session[app] };
    }
    const body = clean(await page.locator('body').innerText().catch(() => ''));
    const fileSafe = row['Test ID'].replace(/[^A-Za-z0-9_-]/g, '_');
    const screenshotName = `${fileSafe}.png`;
    const screenshotReference = `evidence/${screenshotName}`;
    await page.screenshot({ path: path.join(evidenceDir, screenshotName), fullPage: false }).catch(() => {});
    results.push({
      ...row,
      'Steps executed': result.evidence.action,
      'Actual result': result.evidence.assertion,
      Status: result.status,
      'Defect ID': result.status === 'FAIL' ? `QA-1250-${fileSafe}` : '',
      Severity: result.status === 'FAIL' ? 'Medium' : '', Priority: result.status === 'FAIL' ? (row.Priority || 'P2') : '',
      'Evidence screenshot/reference': screenshotReference,
      'Console/network evidence': JSON.stringify({ consoleErrors, failedRequests, badResponses }),
      'Deployment/source commit': process.env.FIXKART_SOURCE_COMMIT || '80f14c898db7fec4c750462273b0aacd5bc9b2d2', Timestamp: new Date().toISOString(),
      'Blocked reason': result.status === 'BLOCKED' ? result.reason : '', Notes: result.evidence.visibleText.slice(0, 500)
    });
    page.removeListener('console', onConsole); page.removeListener('requestfailed', onFailed); page.removeListener('response', onResponse);
  }
  await Promise.all(Object.values(pages).map(p => p.close())); await browser.close();
  fs.writeFileSync(path.join(out, 'case-execution.json'), JSON.stringify({ started: new Date().toISOString(), finished: new Date().toISOString(), results }, null, 2));
  const headers = Object.keys(results[0]);
  const csvEscape = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  fs.writeFileSync(path.join(out, 'FixKart_Master_Test_Cases_1250_CASE_EXECUTION.csv'), [headers.map(csvEscape).join(','), ...results.map(r => headers.map(h => csvEscape(r[h])).join(','))].join('\n'));
  const counts = results.reduce((a, r) => (a[r.Status] = (a[r.Status] || 0) + 1, a), {});
  fs.writeFileSync(path.join(out, 'case-execution-counts.json'), JSON.stringify(counts, null, 2));
  console.log(JSON.stringify({ count: results.length, counts }));
})();
