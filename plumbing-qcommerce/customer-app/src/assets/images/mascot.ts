// Google Stitch Design System Mascot Image Asset
let source: any;

try {
  // Vitest / Node test runner environment check
  if (typeof process !== 'undefined' && (process.env?.VITEST || process.env?.NODE_ENV === 'test')) {
    source = { uri: 'test-plumber-mascot.png' };
  } else {
    // Metro bundler for React Native / Expo Android & Web
    source = require('./plumber-mascot.png');
  }
} catch {
  source = { uri: 'test-plumber-mascot.png' };
}

export const plumberMascotSource = source;
