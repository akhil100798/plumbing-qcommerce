const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, '..', 'reports', 'final-local-regression-20260916', 'retest-master.csv');
function parse(text) {
  const rows = []; let row = []; let field = ''; let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) { if (c === '"' && text[i + 1] === '"') { field += '"'; i += 1; } else if (c === '"') quoted = false; else field += c; }
    else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
  const header = rows.shift().map((x) => x.replace(/^\uFEFF/, ''));
  return { header, rows: rows.map((values) => Object.fromEntries(header.map((h, i) => [h, values[i] ?? '']))) };
}
const csv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
const parsed = parse(fs.readFileSync(file, 'utf8'));
const prior = { 'QA-0177': 'FAIL', 'QA-0179': 'NOT TESTED', 'QA-0184': 'NOT TESTED', 'QA-0186': 'NOT TESTED' };
for (const row of parsed.rows) {
  if (!prior[row.TestID]) continue;
  row.PreviousResult = prior[row.TestID];
  row.Delta = `${row.PreviousResult} -> ${row.CurrentResult}`;
}
fs.writeFileSync(file, `${parsed.header.map(csv).join(',')}\n${parsed.rows.map((row) => parsed.header.map((h) => csv(row[h])).join(',')).join('\n')}\n`, 'utf8');
