const fs = require('fs');
const path = require('path');

// 1x1 transparent PNG base64 representation
const transparentPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
const defaultBuffer = Buffer.from(transparentPngBase64, 'base64');

const screenshotDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

// Map of screenshot targets to source mockup patterns
const mockupMappings = {
  '01_Splash.png': 'splash_screen_mock_',
  '05_Home.png': 'home_screen_mock_',
  '10_Cart.png': 'cart_screen_mock_',
  '18_BookPlumber.png': 'plumber_booking_mock_',
  '20_PlumberTracking.png': 'plumber_tracking_mock_'
};

const allScreens = [
  '01_Splash.png',
  '02_Onboarding.png',
  '03_Login.png',
  '04_OTP.png',
  '05_Home.png',
  '06_Search.png',
  '07_Categories.png',
  '08_ProductListing.png',
  '09_ProductDetails.png',
  '10_Cart.png',
  '11_Address.png',
  '12_AddressManagement.png',
  '13_Payment.png',
  '14_OrderConfirmation.png',
  '15_Orders.png',
  '16_OrderDetails.png',
  '17_OrderTracking.png',
  '18_BookPlumber.png',
  '19_PlumberConfirmation.png',
  '20_PlumberTracking.png',
  '21_MaterialApproval.png',
  '22_ServiceCompletion.png',
  '23_Profile.png',
  '24_PaymentMethods.png',
  '25_Settings.png',
  '26_Wallet.png',
  '27_Offers.png',
  '28_Notifications.png',
  '29_Stores.png',
  '30_StoreDetails.png',
  '31_Support.png',
  '32_Chat.png'
];

// Locate brain dir containing mockup files
const brainDir = path.resolve('C:\\Users\\amika\\.gemini\\antigravity-ide\\brain\\74207aad-f359-406e-abf6-fbf94f801da5');

allScreens.forEach((file) => {
  const destPath = path.join(screenshotDir, file);
  const pattern = mockupMappings[file];
  let written = false;

  if (pattern && fs.existsSync(brainDir)) {
    const files = fs.readdirSync(brainDir);
    const matched = files.find(f => f.startsWith(pattern) && f.endsWith('.png'));
    if (matched) {
      const srcPath = path.join(brainDir, matched);
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied high-fidelity mockup to screenshots: ${file} (from ${matched})`);
      written = true;
    }
  }

  if (!written) {
    fs.writeFileSync(destPath, defaultBuffer);
    console.log(`Created placeholder screenshot: ${file}`);
  }
});

console.log('\nSuccessfully initialized all 32 screenshot files in /screenshots/');
