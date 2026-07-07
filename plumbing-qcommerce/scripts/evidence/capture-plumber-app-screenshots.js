const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.resolve(__dirname, '../../docs/evidence/phase-14h-live-mobile-uat/plumber-app');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

(async () => {
  console.log('Starting plumber-app screenshot capture...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
  });
  const page = await context.newPage();

  try {
    // 1. Navigate to plumber-app Expo Web
    console.log('Navigating to http://localhost:8082...');
    await page.goto('http://localhost:8082');
    await page.waitForTimeout(5000);

    // Save splash
    await page.screenshot({ path: path.join(OUTPUT_DIR, '01-splash.png') });
    console.log('Saved 01-splash.png');

    // Skip onboarding if present
    const skipBtn = page.getByText('Skip', { exact: false });
    if (await skipBtn.count() > 0) {
      await skipBtn.first().click();
      await page.waitForTimeout(2000);
    }

    // 2. Login Screen
    await page.screenshot({ path: path.join(OUTPUT_DIR, '02-login.png') });
    console.log('Saved 02-login.png');

    // Fill in phone number
    await page.keyboard.type('5555555602');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '03-login-filled.png') });
    console.log('Saved 03-login-filled.png');

    // Submit phone number
    const continueBtn = page.getByText('Continue', { exact: false }).first();
    await continueBtn.click();
    await page.waitForTimeout(3000);

    // Enter OTP
    await page.keyboard.type('123456');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '04-otp-filled.png') });
    console.log('Saved 04-otp-filled.png');

    // Verify OTP
    const verifyBtn = page.getByText('Verify', { exact: false }).first();
    await verifyBtn.click();
    await page.waitForTimeout(5000);

    // 3. Dashboard
    await page.screenshot({ path: path.join(OUTPUT_DIR, '05-dashboard.png') });
    console.log('Saved 05-dashboard.png');

    // Toggle shift status
    const onlineToggle = page.getByRole('switch').first();
    if (await onlineToggle.count() > 0) {
      await onlineToggle.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(OUTPUT_DIR, '06-dashboard-online.png') });
      console.log('Saved 06-dashboard-online.png');
    }

    // View Profile
    const profileTab = page.getByText('Profile', { exact: false }).first();
    if (await profileTab.count() > 0) {
      await profileTab.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(OUTPUT_DIR, '07-profile.png') });
      console.log('Saved 07-profile.png');
    }

  } catch (error) {
    console.error('Error during screenshot capture:', error);
  } finally {
    await browser.close();
    console.log('Capture process completed.');
  }
})();
