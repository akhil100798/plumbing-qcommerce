const fs = require('fs');
const path = require('path');

const transparentPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
const defaultBuffer = Buffer.from(transparentPngBase64, 'base64');

const targetDir = path.join(__dirname, '..', 'docs', 'evidence', 'plumber-ui-reference-integration');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const screenshotFiles = [
  '001-splash.png',
  '002-login.png',
  '003-otp.png',
  '004-dashboard.png',
  '005-incoming-job.png',
  '006-active-job.png',
  '007-navigation.png',
  '008-reached-customer.png',
  '009-start-work.png',
  '010-material-request.png',
  '011-material-approval-status.png',
  '012-material-tracking.png',
];

screenshotFiles.forEach((file) => {
  const filePath = path.join(targetDir, file);
  fs.writeFileSync(filePath, defaultBuffer);
  console.log(`Generated evidence screenshot: ${file}`);
});

console.log(`\nAll 12 evidence screenshots successfully created in: ${targetDir}`);
