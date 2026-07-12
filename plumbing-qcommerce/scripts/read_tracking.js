const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'customer-app', 'src', 'screens', 'OrderTrackingScreen.tsx');
const dest = 'C:\\Users\\amika\\.gemini\\antigravity-ide\\brain\\b5e1c330-6b1f-4cdd-b953-3ba8d9f2c5a1\\scratch\\order_tracking.txt';

try {
  const content = fs.readFileSync(src, 'utf8');
  fs.writeFileSync(dest, content, 'utf8');
  console.log('Successfully copied OrderTrackingScreen to scratch!');
} catch (e) {
  console.error('Error copying file:', e.message);
}
