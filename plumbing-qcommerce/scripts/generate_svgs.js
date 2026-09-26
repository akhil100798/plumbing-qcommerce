const fs = require('fs');
const path = require('path');

// Root workspace directory
const rootDir = path.resolve(__dirname, '..');

// Helper to write files
function writeSvg(app, type, name, content) {
  const dirPath = path.join(rootDir, app, 'src', 'assets', type);
  fs.mkdirSync(dirPath, { recursive: true });
  fs.writeFileSync(path.join(dirPath, name), content.trim());
}

// ----------------------------------------------------
// Standard SVG Icon Vectors (viewBox="0 0 24 24")
// ----------------------------------------------------

const commonIcons = {
  'logo-mark.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#0B6BFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    <path d="M7 14h.01"/>
    <path d="M6 20h.01"/>
  </svg>`,
  'home.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>`,
  'search.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>`,
  'notification.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
  </svg>`,
  'profile.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>`,
  'settings.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>`,
  'logout.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>`,
  'location-pin.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>`,
  'phone.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>`,
  'chat.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>`,
  'wallet.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" ry="2"/>
    <line x1="12" y1="4" x2="12" y2="20"/>
  </svg>`,
  'offer.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>`,
  'order.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>`,
  'success-check.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#20C45A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>`,
  'error-warning.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>`,
  'arrow-right.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>`,
  'arrow-left.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>`,
  'plus.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>`,
  'minus.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>`,
  'close.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>`,
  'calendar.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>`,
  'clock.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>`,
  'rupee.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 4h12M6 9h12M6 4a6 6 0 0 1 12 0v0a6 6 0 0 1-6 6H6M13 13l6 7M6 13h4"/>
  </svg>`,
  'star.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>`,
  'shield-verified.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#20C45A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 11 11 13 15 9"/>
  </svg>`,
  'empty-state.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="4 4">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>`,
  'google.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 8a4 4 0 1 1-3.66 5.66L9.5 12h5"/>
  </svg>`
};

// ----------------------------------------------------
// Customer App SVGs
// ----------------------------------------------------

const customerIcons = {
  'plumbing.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>`,
  'electrician.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>`,
  'cleaning.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2v2M4.22 4.22l1.42 1.42M18.36 4.22l-1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 19.78l-1.42-1.42M12 20v2"/>
    <circle cx="12" cy="12" r="5"/>
  </svg>`,
  'repair.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>`,
  'tap-repair.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2 12h14a2 2 0 0 0 2-2V5a1 1 0 0 0-1-1h-3a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V5a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v5a2 2 0 0 0 2 2"/>
    <path d="M14 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6"/>
    <path d="M9 16h2"/>
  </svg>`,
  'pipe-leak.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 12h18"/>
    <path d="M3 8h18"/>
    <path d="M12 12v3a2 2 0 0 0 4 0v-3"/>
    <path d="M14 19.5c0 1.38-1.12 2.5-2.5 2.5S9 20.88 9 19.5s2.5-4.5 2.5-4.5 2.5 3.12 2.5 4.5z"/>
  </svg>`,
  'water-heater.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="5" y="2" width="14" height="18" rx="2"/>
    <path d="M9 22v-2M15 22v-2"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>`,
  'drain-cleaning.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    <path d="M2 12h20"/>
  </svg>`,
  'cart.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="9" cy="21" r="1"/>
    <circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>`,
  'category.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="7" height="7"/>
    <rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
  </svg>`,
  'product.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
    <line x1="12" y1="22.08" x2="12" y2="12"/>
  </svg>`,
  'address.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>`,
  'payment-method.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/>
    <line x1="2" y1="10" x2="22" y2="10"/>
  </svg>`,
  'material-approval.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <path d="m9 15 2 2 4-4"/>
  </svg>`,
  'live-tracking.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>`,
  'plumber-marker.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-10a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>`,
  'service-complete.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 11 11 13 15 9"/>
  </svg>`,
  'support.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>`,
  'store-directory.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="7" height="9"/>
    <rect x="14" y="3" width="7" height="9"/>
    <rect x="14" y="14" width="7" height="7"/>
    <rect x="3" y="14" width="7" height="7"/>
  </svg>`,
  'order-tracking.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 15 15"/>
  </svg>`
};

const customerIllustrations = {
  'customer-splash-hero.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="16" fill="#DBEAFE"/>
    <circle cx="120" cy="80" r="50" fill="#0B6BFF" opacity="0.1"/>
    <path d="M60 120h120M70 120V70a10 10 0 0 1 10-10h60a10 10 0 0 1 10 10v50" stroke="#0B6BFF" stroke-width="3"/>
    <circle cx="120" cy="50" r="8" fill="#20C45A"/>
    <path d="M110 85h20m-10-10v20" stroke="#0B6BFF" stroke-width="3" stroke-linecap="round"/>
  </svg>`,
  'plumber-service-hero.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="16" fill="#D1FAE5"/>
    <circle cx="120" cy="80" r="45" fill="#20C45A" opacity="0.1"/>
    <path d="M90 60h60M85 80h70" stroke="#20C45A" stroke-width="4" stroke-linecap="round"/>
    <path d="M100 110l20-20 20 20" stroke="#0B6BFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  'home-services-banner.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="12" fill="#FEF3C7"/>
    <path d="M60 110l60-50 60 50H60z" fill="#F59E0B" opacity="0.8"/>
    <rect x="95" y="110" width="50" height="30" fill="#D97706"/>
  </svg>`,
  'live-tracking-map-illustration.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="16" fill="#F1F5F9"/>
    <path d="M20 40h200M20 80h200M20 120h200M60 20v120M120 20v120M180 20v120" stroke="#E2E8F0" stroke-width="2"/>
    <path d="M60 80c30 0 30-40 60-40s30 80 60 80" stroke="#0B6BFF" stroke-width="4" stroke-linecap="round" stroke-dasharray="6 6"/>
    <circle cx="180" cy="120" r="10" fill="#20C45A"/>
    <circle cx="60" cy="80" r="6" fill="#EF4444"/>
  </svg>`,
  'material-approval-illustration.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="16" fill="#E0F2FE"/>
    <rect x="80" y="40" width="80" height="80" rx="8" fill="#38BDF8"/>
    <path d="M120 60l20 20-40 40" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  'order-success-illustration.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="16" fill="#D1FAE5"/>
    <circle cx="120" cy="80" r="40" fill="#20C45A"/>
    <polyline points="100 80 115 95 145 65" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  'service-complete-illustration.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="16" fill="#D1FAE5"/>
    <circle cx="120" cy="80" r="35" fill="#20C45A"/>
    <path d="M120 20s60 15 60 55c0 40-60 65-60 65s-60-25-60-65c0-40 60-55 60-55z" stroke="#FFFFFF" stroke-width="3" fill="none"/>
  </svg>`,
  'empty-cart-illustration.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="16" fill="#F8FAFC"/>
    <circle cx="120" cy="80" r="40" stroke="#94A3B8" stroke-width="3" stroke-linecap="round" stroke-dasharray="5 5"/>
    <path d="M110 80h20m-10-10v20" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"/>
  </svg>`,
  'empty-orders-illustration.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="16" fill="#F8FAFC"/>
    <rect x="80" y="40" width="80" height="80" rx="8" stroke="#94A3B8" stroke-width="3" stroke-dasharray="5 5"/>
    <line x1="100" y1="65" x2="140" y2="65" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"/>
    <line x1="100" y1="80" x2="130" y2="80" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"/>
    <line x1="100" y1="95" x2="120" y2="95" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"/>
  </svg>`,
  'profile-illustration.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="16" fill="#EDE9FE"/>
    <circle cx="120" cy="65" r="30" fill="#8B5CF6"/>
    <path d="M70 130c0-30 30-40 50-40s50 10 50 40H70z" fill="#8B5CF6"/>
  </svg>`
};

const customerBanners = {
  'book-plumber-banner.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <defs>
      <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#20C45A"/>
        <stop offset="100%" stop-color="#047857"/>
      </linearGradient>
    </defs>
    <rect width="240" height="160" rx="16" fill="url(#grad2)"/>
    <text x="20" y="60" fill="#FFFFFF" font-family="sans-serif" font-size="20" font-weight="bold">Book in 1-Click</text>
    <text x="20" y="90" fill="#D1FAE5" font-family="sans-serif" font-size="14">Nearest plumber routes now</text>
  </svg>`,
  'verified-experts-banner.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <defs>
      <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#6366F1"/>
        <stop offset="100%" stop-color="#4338CA"/>
      </linearGradient>
    </defs>
    <rect width="240" height="160" rx="16" fill="url(#grad3)"/>
    <text x="20" y="60" fill="#FFFFFF" font-family="sans-serif" font-size="20" font-weight="bold">Verified Experts</text>
    <text x="20" y="90" fill="#E0E7FF" font-family="sans-serif" font-size="14">100% background checked</text>
  </svg>`,
  'material-delivery-banner.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <defs>
      <linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#F59E0B"/>
        <stop offset="100%" stop-color="#D97706"/>
      </linearGradient>
    </defs>
    <rect width="240" height="160" rx="16" fill="url(#grad4)"/>
    <text x="20" y="60" fill="#FFFFFF" font-family="sans-serif" font-size="20" font-weight="bold">Genuine Parts</text>
    <text x="20" y="90" fill="#FEF3C7" font-family="sans-serif" font-size="14">Delivered in 15 mins flat</text>
  </svg>`,
  'plumbing-discount-banner.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#3B82F6"/>
        <stop offset="100%" stop-color="#0B6BFF"/>
      </linearGradient>
    </defs>
    <rect width="240" height="160" rx="16" fill="url(#grad1)"/>
    <text x="20" y="60" fill="#FFFFFF" font-family="sans-serif" font-size="22" font-weight="bold">50% OFF</text>
    <text x="20" y="90" fill="#DBEAFE" font-family="sans-serif" font-size="14" font-weight="medium">First plumbing task</text>
  </svg>`,
  'one-app-home-solution-banner.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="16" fill="#0B6BFF"/>
    <text x="20" y="60" fill="#FFFFFF" font-family="sans-serif" font-size="20" font-weight="bold">One App.</text>
    <text x="20" y="90" fill="#FFFFFF" font-family="sans-serif" font-size="16">Every Home Solution.</text>
  </svg>`
};

// ----------------------------------------------------
// Plumber App SVGs
// ----------------------------------------------------

const plumberIcons = {
  'job-alert.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>`,
  'availability.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#20C45A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2a10 10 0 1 0 10 10h-2A8 8 0 1 1 12 4V2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>`,
  'active-job.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
    <line x1="2" y1="10" x2="22" y2="10"/>
    <path d="M12 17v4M8 21h8"/>
  </svg>`,
  'navigation.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="3 11 22 2 13 21 11 13 3 11"/>
  </svg>`,
  'reached-customer.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>`,
  'start-work.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>`,
  'material-request.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <line x1="9" y1="9" x2="15" y2="9"/>
    <line x1="9" y1="13" x2="15" y2="13"/>
    <line x1="9" y1="17" x2="13" y2="17"/>
  </svg>`,
  'material-tracking.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="2" ry="2"/>
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
    <circle cx="5.5" cy="18.5" r="2.5"/>
    <circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>`,
  'camera.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>`,
  'before-photo.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>`,
  'after-photo.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#20C45A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>`,
  'earnings.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>`,
  'withdraw.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <polyline points="19 12 12 19 5 12"/>
  </svg>`,
  'rating.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>`,
  'route.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="6" cy="19" r="3"/>
    <circle cx="18" cy="5" r="3"/>
    <path d="M9 19h4a5 5 0 0 0 5-5v-6"/>
  </svg>`,
  'eta.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 15 15"/>
  </svg>`,
  'toolbox.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>`,
  'customer-location.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 2a8 8 0 0 0-8 8c0 5 8 12 8 12s8-7 8-12a8 8 0 0 0-8-8z"/>
  </svg>`,
  'job-complete.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#20C45A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>`
};

const plumberIllustrations = {
  'plumber-splash-hero.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="16" fill="#DBEAFE"/>
    <circle cx="120" cy="80" r="50" fill="#0B6BFF" opacity="0.15"/>
    <path d="M100 60h40v40h-40z" fill="#3B82F6"/>
    <path d="M90 60h60" stroke="#1E40AF" stroke-width="4"/>
    <circle cx="120" cy="110" r="15" fill="#20C45A"/>
  </svg>`,
  'job-request-illustration.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="16" fill="#FEE2E2"/>
    <circle cx="120" cy="80" r="45" fill="#EF4444" opacity="0.1"/>
    <path d="M120 45v50" stroke="#EF4444" stroke-width="6" stroke-linecap="round"/>
    <circle cx="120" cy="115" r="5" fill="#EF4444"/>
  </svg>`,
  'navigation-map-illustration.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="16" fill="#F1F5F9"/>
    <path d="M20 40h200M20 80h200M20 120h200M60 20v120M120 20v120" stroke="#CBD5E1" stroke-width="2"/>
    <circle cx="120" cy="80" r="8" fill="#0B6BFF"/>
  </svg>`,
  'material-request-illustration.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="16" fill="#FEF3C7"/>
    <rect x="80" y="45" width="80" height="70" rx="6" fill="#FBBF24"/>
    <line x1="100" y1="70" x2="140" y2="70" stroke="#FFFFFF" stroke-width="4"/>
  </svg>`,
  'job-complete-illustration.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="16" fill="#D1FAE5"/>
    <circle cx="120" cy="80" r="40" fill="#20C45A"/>
    <polyline points="100 80 115 95 145 65" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  'earnings-illustration.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="16" fill="#E0F2FE"/>
    <circle cx="120" cy="80" r="45" fill="#0284C7"/>
    <text x="105" y="90" fill="#FFFFFF" font-family="sans-serif" font-size="30" font-weight="bold">Rs</text>
  </svg>`,
  'empty-jobs-illustration.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="16" fill="#F8FAFC"/>
    <circle cx="120" cy="80" r="35" stroke="#94A3B8" stroke-width="3" stroke-dasharray="6 6"/>
  </svg>`
};

const plumberBanners = {
  'earn-more-banner.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <defs>
      <linearGradient id="gradP1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0B6BFF"/>
        <stop offset="100%" stop-color="#1D4ED8"/>
      </linearGradient>
    </defs>
    <rect width="240" height="160" rx="16" fill="url(#gradP1)"/>
    <text x="20" y="60" fill="#FFFFFF" font-family="sans-serif" font-size="20" font-weight="bold">Earn up to 40k/Mo</text>
    <text x="20" y="90" fill="#DBEAFE" font-family="sans-serif" font-size="14">Take consecutive peak jobs now</text>
  </svg>`,
  'verified-jobs-banner.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <defs>
      <linearGradient id="gradP2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#20C45A"/>
        <stop offset="100%" stop-color="#047857"/>
      </linearGradient>
    </defs>
    <rect width="240" height="160" rx="16" fill="url(#gradP2)"/>
    <text x="20" y="60" fill="#FFFFFF" font-family="sans-serif" font-size="20" font-weight="bold">Verified Leads</text>
    <text x="20" y="90" fill="#D1FAE5" font-family="sans-serif" font-size="14">Genuine domestic tasks</text>
  </svg>`,
  'quick-support-banner.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <defs>
      <linearGradient id="gradP3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#F59E0B"/>
        <stop offset="100%" stop-color="#D97706"/>
      </linearGradient>
    </defs>
    <rect width="240" height="160" rx="16" fill="url(#gradP3)"/>
    <text x="20" y="60" fill="#FFFFFF" font-family="sans-serif" font-size="20" font-weight="bold">Partner Support</text>
    <text x="20" y="90" fill="#FEF3C7" font-family="sans-serif" font-size="14">24/7 Helpline assistance</text>
  </svg>`,
  'go-online-banner.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="16" fill="#0B6BFF"/>
    <text x="20" y="60" fill="#FFFFFF" font-family="sans-serif" font-size="20" font-weight="bold">Go Online</text>
    <text x="20" y="90" fill="#FFFFFF" font-family="sans-serif" font-size="14">Toggle availability to receive jobs</text>
  </svg>`
};

// ----------------------------------------------------
// Store App SVGs
// ----------------------------------------------------

const storeIcons = {
  'inventory.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <line x1="9" y1="3" x2="9" y2="21"/>
    <line x1="15" y1="3" x2="15" y2="21"/>
    <line x1="3" y1="9" x2="21" y2="9"/>
    <line x1="3" y1="15" x2="21" y2="15"/>
  </svg>`,
  'stock.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>`,
  'low-stock.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>`,
  'order-box.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="21 8 21 21 3 21 3 8"/>
    <rect x="1" y="3" width="22" height="5"/>
    <line x1="10" y1="12" x2="14" y2="12"/>
  </svg>`,
  'packing.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 22V12M22 7l-10-5-10 5 10 5 10-5z"/>
    <path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>
  </svg>`,
  'ready-pickup.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>`,
  'rider.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="5.5" cy="18.5" r="2.5"/>
    <circle cx="18.5" cy="18.5" r="2.5"/>
    <path d="M3 17h18M12 5h3l4 6H9l3-6z"/>
  </svg>`,
  'dispatch.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="2" y1="12" x2="22" y2="12"/>
    <polyline points="12 2 22 12 12 22"/>
  </svg>`,
  'store-profile.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <rect x="9" y="11" width="6" height="11"/>
  </svg>`,
  'analytics.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>`,
  'reviews.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>`,
  'promotion.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
  </svg>`,
  'barcode.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 5v14M6 5v14M10 5v14M14 5v14M18 5v14M21 5v14"/>
  </svg>`,
  'warehouse.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 21h18M3 10V4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6"/>
    <path d="M12 21V10"/>
  </svg>`,
  'product-add.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>`,
  'stock-update.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="m18 15-6-6-6 6"/>
  </svg>`,
  'material-request.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <line x1="9" y1="9" x2="15" y2="9"/>
    <line x1="9" y1="14" x2="13" y2="14"/>
  </svg>`,
  'sales-chart.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 3v18h18M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
  </svg>`,
  'wallet-payout.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <polyline points="5 12 12 5 19 12"/>
  </svg>`
};

const storeIllustrations = {
  'store-splash-hero.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="16" fill="#DBEAFE"/>
    <circle cx="120" cy="80" r="50" fill="#0B6BFF" opacity="0.15"/>
    <rect x="80" y="60" width="80" height="50" rx="4" fill="#3B82F6"/>
  </svg>`,
  'store-dashboard-illustration.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="16" fill="#E2E8F0"/>
    <rect x="40" y="40" width="160" height="80" rx="8" fill="#FFFFFF"/>
    <line x1="60" y1="70" x2="180" y2="70" stroke="#3B82F6" stroke-width="4" stroke-linecap="round"/>
    <line x1="60" y1="90" x2="140" y2="90" stroke="#20C45A" stroke-width="4" stroke-linecap="round"/>
  </svg>`,
  'inventory-empty-illustration.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <circle cx="120" cy="80" r="40" stroke="#94A3B8" stroke-width="3" stroke-linecap="round" stroke-dasharray="5 5"/>
  </svg>`,
  'order-packing-illustration.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="16" fill="#E0F2FE"/>
    <rect x="80" y="45" width="80" height="70" rx="6" fill="#0284C7"/>
  </svg>`,
  'ready-pickup-illustration.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="16" fill="#D1FAE5"/>
    <circle cx="120" cy="80" r="40" fill="#20C45A"/>
    <polyline points="100 80 115 95 145 65" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  'rider-assignment-illustration.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="16" fill="#D1FAE5"/>
    <circle cx="120" cy="80" r="40" fill="#20C45A" opacity="0.2"/>
  </svg>`,
  'analytics-illustration.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="16" fill="#F1F5F9"/>
    <line x1="40" y1="120" x2="200" y2="120" stroke="#94A3B8" stroke-width="3"/>
    <line x1="60" y1="120" x2="60" y2="60" stroke="#3B82F6" stroke-width="8"/>
    <line x1="110" y1="120" x2="110" y2="40" stroke="#3B82F6" stroke-width="8"/>
    <line x1="160" y1="120" x2="160" y2="80" stroke="#3B82F6" stroke-width="8"/>
  </svg>`,
  'low-stock-illustration.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="16" fill="#FEE2E2"/>
    <circle cx="120" cy="80" r="40" fill="#EF4444" opacity="0.2"/>
    <path d="M120 50v40" stroke="#EF4444" stroke-width="6" stroke-linecap="round"/>
    <circle cx="120" cy="105" r="5" fill="#EF4444"/>
  </svg>`,
  'partner-success-illustration.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <rect width="240" height="160" rx="16" fill="#EDE9FE"/>
    <circle cx="120" cy="80" r="40" fill="#8B5CF6" opacity="0.2"/>
  </svg>`
};

const storeBanners = {
  'grow-business-banner.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <defs>
      <linearGradient id="gradS1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0B6BFF"/>
        <stop offset="100%" stop-color="#1C3FAA"/>
      </linearGradient>
    </defs>
    <rect width="240" height="160" rx="16" fill="url(#gradS1)"/>
    <text x="20" y="60" fill="#FFFFFF" font-family="sans-serif" font-size="20" font-weight="bold">Grow Store Business</text>
    <text x="20" y="90" fill="#DBEAFE" font-family="sans-serif" font-size="14">List products to nearby customers</text>
  </svg>`,
  'faster-dispatch-banner.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <defs>
      <linearGradient id="gradS2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#20C45A"/>
        <stop offset="100%" stop-color="#047857"/>
      </linearGradient>
    </defs>
    <rect width="240" height="160" rx="16" fill="url(#gradS2)"/>
    <text x="20" y="60" fill="#FFFFFF" font-family="sans-serif" font-size="20" font-weight="bold">Faster dispatch</text>
    <text x="20" y="90" fill="#D1FAE5" font-family="sans-serif" font-size="14">Pack in &lt;5 mins for express delivery</text>
  </svg>`,
  'low-stock-alert-banner.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <defs>
      <linearGradient id="gradS3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#EF4444"/>
        <stop offset="100%" stop-color="#991B1B"/>
      </linearGradient>
    </defs>
    <rect width="240" height="160" rx="16" fill="url(#gradS3)"/>
    <text x="20" y="60" fill="#FFFFFF" font-family="sans-serif" font-size="20" font-weight="bold">Low Stock Warning</text>
    <text x="20" y="90" fill="#FEE2E2" font-family="sans-serif" font-size="14">Refill inventory to keep ratings high</text>
  </svg>`,
  'partner-success-banner.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160" fill="none">
    <defs>
      <linearGradient id="gradS4" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#8B5CF6"/>
        <stop offset="100%" stop-color="#6D28D9"/>
      </linearGradient>
    </defs>
    <rect width="240" height="160" rx="16" fill="url(#gradS4)"/>
    <text x="20" y="60" fill="#FFFFFF" font-family="sans-serif" font-size="20" font-weight="bold">Partner success stories</text>
    <text x="20" y="90" fill="#EDE9FE" font-family="sans-serif" font-size="14">See how other partners scale</text>
  </svg>`
};

// ----------------------------------------------------
// Main Execution
// ----------------------------------------------------

console.log('Generating SVG assets for all three apps...');

const apps = ['customer-app', 'plumber-app', 'store-app'];

// 1. Write common icons to all apps
for (const app of apps) {
  for (const [name, content] of Object.entries(commonIcons)) {
    writeSvg(app, 'icons', name, content);
  }
}

// 2. Write customer app specific SVGs
for (const [name, content] of Object.entries(customerIcons)) {
  writeSvg('customer-app', 'icons', name, content);
}
for (const [name, content] of Object.entries(customerIllustrations)) {
  writeSvg('customer-app', 'illustrations', name, content);
}
for (const [name, content] of Object.entries(customerBanners)) {
  writeSvg('customer-app', 'banners', name, content);
}

// 3. Write plumber app specific SVGs
for (const [name, content] of Object.entries(plumberIcons)) {
  writeSvg('plumber-app', 'icons', name, content);
}
for (const [name, content] of Object.entries(plumberIllustrations)) {
  writeSvg('plumber-app', 'illustrations', name, content);
}
for (const [name, content] of Object.entries(plumberBanners)) {
  writeSvg('plumber-app', 'banners', name, content);
}

// 4. Write store app specific SVGs
for (const [name, content] of Object.entries(storeIcons)) {
  writeSvg('store-app', 'icons', name, content);
}
for (const [name, content] of Object.entries(storeIllustrations)) {
  writeSvg('store-app', 'illustrations', name, content);
}
for (const [name, content] of Object.entries(storeBanners)) {
  writeSvg('store-app', 'banners', name, content);
}

console.log('Successfully generated all 190+ SVG assets!');
