const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(
  path.resolve('reports/final-local-regression-20260916/plumber-material-ui-20260922.cjs'),
  'utf8',
);
let script = source.replace(
  'const reportDir = __dirname;',
  "const reportDir = path.resolve('reports/final-local-regression-20260916');",
);
script = script.replace(
  'plumber-material-ui-20260922.json',
  'plumber-order24-before-photos-20260922.json',
);
const originalSelector = "    let activeJob = page.getByRole('button', { name: /Active job/i }).first();";
const targetSelector = [
  "    await page.getByRole('tab', { name: 'Jobs', exact: true }).click();",
  '    await page.waitForTimeout(1500);',
  "    let activeJob = page.getByRole('button', { name: /Open job .*#24/i }).first();",
].join('\n');
if (!script.includes(originalSelector)) throw new Error('target selector not found');
script = script.replace(originalSelector, targetSelector);
const fallback = '    if (!(await activeJob.count())) {';
const start = script.indexOf(fallback, script.indexOf('let activeJob'));
if (start < 0) throw new Error('fallback marker not found');
script = script.slice(0, start) + script.slice(start).replace(
  fallback,
  '    if (false && !(await activeJob.count())) {',
);
new Function('require', '__dirname', script)(require, path.resolve('reports/final-local-regression-20260916'));
