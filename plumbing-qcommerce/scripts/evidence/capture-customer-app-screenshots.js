const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.resolve(__dirname, '../../docs/evidence/phase-14h-live-mobile-uat/customer-app');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

(async () => {
  console.log('Starting customer-app screenshot capture...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 }, // Mobile viewport
    isMobile: true,
  });
  const page = await context.newPage();

  try {
    // 1. Navigate to customer-app Expo Web
    console.log('Navigating to http://localhost:8081...');
    await page.goto('http://localhost:8081');
    await page.waitForTimeout(5000); // Wait for Metro bundler

    // Take onboarding/splash screenshot if present
    await page.screenshot({ path: path.join(OUTPUT_DIR, '01-splash.png') });
    console.log('Saved 01-splash.png');

    // Skip onboarding
    const skipBtn = page.getByText('Skip', { exact: false });
    if (await skipBtn.count() > 0) {
      await skipBtn.first().click();
      await page.waitForTimeout(2000);
    }

    // 2. Login Screen
    await page.screenshot({ path: path.join(OUTPUT_DIR, '02-login.png') });
    console.log('Saved 02-login.png');

    // Fill in phone number
    const phoneInput = page.locator('input[type="tel"]').first();
    if (await phoneInput.count() > 0) {
      await phoneInput.fill('5555555601');
    } else {
      await page.keyboard.type('5555555601');
    }
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '03-login-filled.png') });
    console.log('Saved 03-login-filled.png');

    // Submit phone number
    const continueBtn = page.getByText('Continue', { exact: false }).first();
    await continueBtn.click();
    await page.waitForTimeout(3000);

    // Enter OTP
    await page.screenshot({ path: path.join(OUTPUT_DIR, '04-otp-screen.png') });
    console.log('Saved 04-otp-screen.png');

    // Type default bypass OTP
    await page.keyboard.type('123456');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '05-otp-filled.png') });
    console.log('Saved 05-otp-filled.png');

    // Verify OTP
    const verifyBtn = page.getByText('Verify', { exact: false }).first();
    await verifyBtn.click();
    await page.waitForTimeout(5000); // Wait for login transition

    // 3. Home Screen / Catalog
    await page.screenshot({ path: path.join(OUTPUT_DIR, '06-home.png') });
    console.log('Saved 06-home.png');

    // Scroll to products
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, '07-catalog.png') });
    console.log('Saved 07-catalog.png');

  } catch (error) {
    console.error('Error during screenshot capture:', error);
  } finally {
    await browser.close();
    console.log('Capture process completed.');
  }
})();
