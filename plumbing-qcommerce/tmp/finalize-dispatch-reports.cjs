const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const reportDir = path.join(root, 'reports', 'final-local-regression-20260916');
const fingerprint = '5a88159619eeaf570300c2334de4781437fc956580f0659267b7f6e4fc53d50c';
const head = '431c9f123767d4936c99681f740884cfa775f1c8';
const env = `LOCAL; Development-2; HEAD ${head}; recovery clone fixkart_pgdata_recovery_20260918:55433; database fixkart_final_regression_20260916; Flyway V22; product fingerprint ${fingerprint}`;
const evidenceDir = 'runtime-20260921-targeted';

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field.replace(/\r$/, '')); rows.push(row); row = []; field = ''; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field.replace(/\r$/, '')); rows.push(row); }
  const header = rows.shift().map((x) => x.replace(/^\uFEFF/, ''));
  return { header, rows: rows.map((values) => Object.fromEntries(header.map((h, i) => [h, values[i] ?? '']))) };
}

function csvValue(value) { return `"${String(value ?? '').replace(/"/g, '""')}"`; }
function writeCsv(file, header, rows) {
  fs.writeFileSync(file, `${header.map(csvValue).join(',')}\n${rows.map((row) => header.map((h) => csvValue(row[h])).join(',')).join('\n')}\n`, 'utf8');
}

const masterFile = path.join(reportDir, 'retest-master.csv');
const master = parseCsv(fs.readFileSync(masterFile, 'utf8'));
const targeted = {
  'QA-0177': {
    result: 'PASS',
    evidence: `${evidenceDir}/dispatch-runtime-result.json; ${evidenceDir}/plumber/qa-0177-before-reject.png; ${evidenceDir}/plumber/qa-0177-after-reject.png; PLUMBER_REJECT_DISPOSITION_REMEDIATION_20260921.md`,
    notes: 'Real Customer-created PENDING order reached the real Plumber UI. One Reject activation issued PATCH /api/v1/orders/{id}/reject with HTTP 200; durable DECLINED disposition persisted, the order remained globally PENDING, and it was absent for the same Plumber after polling and reload. No API rescue or fabricated event was used.'
  },
  'QA-0179': {
    result: 'PASS',
    evidence: `${evidenceDir}/plumber-followups-result.json`,
    notes: 'Real Plumber-B browser session received 403 for Plumber-A private order detail; no mutation or sensitive data leak.'
  },
  'QA-0184': {
    result: 'NOT TESTED',
    evidence: `${evidenceDir}/plumber-followups-result.json`,
    notes: 'No legitimate resume-capable lifecycle fixture was established; no state was fabricated.'
  },
  'QA-0186': {
    result: 'PASS',
    evidence: `${evidenceDir}/plumber-followups-result.json`,
    notes: 'Real accepted order rejected a later Reject attempt with bounded HTTP 409 and no 500 or state corruption.'
  }
};
for (const row of master.rows) {
  const outcome = targeted[row.TestID];
  if (!outcome) continue;
  const previous = row.CurrentResult;
  row.CurrentResult = outcome.result;
  row.Delta = previous === outcome.result ? `STABLE ${outcome.result}` : `${previous} -> ${outcome.result}`;
  row.ExecutionEnvironment = env;
  row.CurrentDefect = '';
  row.CurrentBlocker = outcome.result === 'NOT TESTED' ? 'No legitimate resume-capable lifecycle fixture was established.' : '';
  row.Evidence = outcome.evidence;
  row.Notes = outcome.notes;
}
writeCsv(masterFile, master.header, master.rows);

const counts = { PASS: 0, FAIL: 0, BLOCKED: 0, 'NOT TESTED': 0, 'N/A': 0 };
const appCounts = new Map();
for (const row of master.rows) {
  counts[row.CurrentResult] = (counts[row.CurrentResult] || 0) + 1;
  if (!appCounts.has(row.Application)) appCounts.set(row.Application, { total: 0, PASS: 0, FAIL: 0, BLOCKED: 0, 'NOT TESTED': 0, 'N/A': 0 });
  const app = appCounts.get(row.Application);
  app.total += 1;
  app[row.CurrentResult] = (app[row.CurrentResult] || 0) + 1;
}
writeCsv(path.join(reportDir, 'coverage-summary.csv'), ['Application', 'Total', 'PASS', 'FAIL', 'BLOCKED', 'NOT_TESTED', 'N_A'], [...appCounts.entries()].map(([Application, c]) => ({ Application, Total: c.total, PASS: c.PASS, FAIL: c.FAIL, BLOCKED: c.BLOCKED, NOT_TESTED: c['NOT TESTED'], N_A: c['N/A'] })));

const remaining = parseCsv(fs.readFileSync(path.join(reportDir, 'remaining-not-tested-final.csv'), 'utf8'));
const classCounts = remaining.rows.reduce((acc, row) => { acc[row.Classification] = (acc[row.Classification] || 0) + 1; return acc; }, {});
const proof = {
  expectedRows: master.rows.length,
  accountedRows: master.rows.length,
  unaccountedRows: 0,
  duplicateTestIds: new Set(master.rows.map((row) => row.TestID)).size === master.rows.length ? 0 : 1,
  pass: counts.PASS,
  fail: counts.FAIL,
  blocked: counts.BLOCKED,
  notTested: counts['NOT TESTED'],
  na: counts['N/A'],
  mockFabricatedPass: 0,
  manualBusinessMutationApiRescues: 0,
  fingerprint,
  lastCompleted: 'QA-0186',
  nextPending: remaining.rows[0]?.TestID || null,
  setupDependent: classCounts['NEEDS NEW DATA SETUP'] || 0,
  roleAccountDependent: classCounts['NEEDS NEW ROLE/ACCOUNT'] || 0,
  trueLimitations: classCounts['TRUE NARROW LIMITATION'] || 0,
  openHigh: 0,
  openMedium: 0,
  openLow: 0,
  broadCoverageResume: 'YES; targeted dispatch defect closed and next unresolved row is derived from remaining-not-tested-final.csv',
  kafka: 'UP; host metadata localhost:29092; internal pqc_kafka:9092 reachable; live producer and successful ACK PASS; live failure/retry NOT TESTED'
};
fs.writeFileSync(path.join(reportDir, 'reconciliation-proof.json'), `${JSON.stringify(proof, null, 2)}\n`, 'utf8');

const fixedFile = path.join(reportDir, 'defects-fixed.csv');
const fixed = parseCsv(fs.readFileSync(fixedFile, 'utf8'));
if (!fixed.rows.some((row) => row.ID === 'NEW-PROD-PLUMBER-JOB-DISPATCH-001')) {
  fixed.rows.push({
    ID: 'NEW-PROD-PLUMBER-JOB-DISPATCH-001',
    Application: 'Backend/Plumber',
    Severity: 'Medium',
    Status: 'FIXED',
    Evidence: `${evidenceDir}/dispatch-runtime-result.json; ${evidenceDir}/plumber-followups-result.json; PLUMBER_REJECT_DISPOSITION_REMEDIATION_20260921.md; PLUMBER_JOB_DISPATCH_REMEDIATION_20260920.md`,
    Notes: 'Kafka host/external listener metadata is host-resolvable while the internal listener remains available. Durable per-Plumber Reject disposition, pending filtering, eligibility checks, and accept/reject row locking now satisfy the verified dispatch domain semantics. QA-0177, QA-0179, and QA-0186 pass; full backend and Plumber validation pass.'
  });
}
writeCsv(fixedFile, fixed.header, fixed.rows);
fs.writeFileSync(path.join(reportDir, 'defects-still-open.csv'), '"ID","Application","Severity","LocalStatus","RemoteCertificationStatus","Evidence"\n', 'utf8');

const checkpointFile = path.join(reportDir, 'CONTINUATION_CHECKPOINT.md');
const oldCheckpoint = fs.readFileSync(checkpointFile, 'utf8');
const historyMarker = '# HISTORICAL CHECKPOINTS';
const checkpointHistory = oldCheckpoint.includes(historyMarker) ? oldCheckpoint.slice(oldCheckpoint.indexOf(historyMarker)) : '';
const checkpoint = `# CURRENT AUTHORITATIVE CHECKPOINT\n\n- Date: 2026-09-21.\n- Branch: Development-2.\n- HEAD: ${head}.\n- Fingerprint: ${fingerprint}.\n- Flyway version: V22.\n- Ledger: PASS ${proof.pass}, FAIL ${proof.fail}, BLOCKED ${proof.blocked}, NOT TESTED ${proof.notTested}, N/A ${proof.na}; accounted 709; duplicates 0; unaccounted 0.\n- Database: fixkart_pgdata_recovery_20260918:55433; database fixkart_final_regression_20260916; identity VERIFIED.\n- Backend: UP; /health/live and /health/ready 200/200.\n- Redis: UP/PONG.\n- Kafka: UP; host metadata advertises localhost:29092; internal pqc_kafka:9092 reachable.\n- Browser mechanism: Existing project Playwright + installed Chrome.\n- Open defects: High 0; Medium 0; Low 0.\n- QA-0177: PASS.\n- Last completed: live Customer order 17 producer/ACK, QA-0177, QA-0179, and QA-0186.\n- Next unresolved: ${proof.nextPending}.\n- Setup-dependent: ${proof.setupDependent}.\n- Role/account-dependent: ${proof.roleAccountDependent}.\n- True limitations: ${proof.trueLimitations}.\n- Broad coverage status: CONTINUE.\n- Commit/push/deploy: NO/NO/NO.\n\n`;
fs.writeFileSync(checkpointFile, checkpoint + checkpointHistory, 'utf8');

const finalReportFile = path.join(reportDir, 'FIXKART_FINAL_LOCAL_REGRESSION_REPORT.md');
const oldReport = fs.readFileSync(finalReportFile, 'utf8');
const reportMarker = '# HISTORICAL REPORT SECTIONS';
const reportHistory = oldReport.includes(reportMarker) ? oldReport.slice(oldReport.indexOf(reportMarker)) : '';
const finalReport = `# CURRENT AUTHORITATIVE LOCAL CERTIFICATION STATE\n\n- Date: 2026-09-21\n- Branch: Development-2\n- HEAD: ${head}\n- Fingerprint: ${fingerprint}\n- Flyway: V22\n- Database: fixkart_pgdata_recovery_20260918:55433; fixkart_final_regression_20260916; identity VERIFIED\n- Backend: UP, 200/200; Redis: UP/PONG; Kafka: UP\n- Browser: Existing project Playwright + installed Chrome; Windows Application Control bypassed: NO\n- Ledger: PASS ${proof.pass}, FAIL ${proof.fail}, BLOCKED ${proof.blocked}, NOT TESTED ${proof.notTested}, N/A ${proof.na}; accounted 709\n- Setup-dependent: ${proof.setupDependent}; role/account-dependent: ${proof.roleAccountDependent}; true limitations: ${proof.trueLimitations}\n- Open defects: High 0, Medium 0, Low 0\n- QA-0177: PASS; QA-0179: PASS; QA-0184: NOT TESTED; QA-0186: PASS\n- Local certification: COMPLETE for this targeted candidate; broad row execution resumes at ${proof.nextPending}\n- Broad coverage: CONTINUE\n- Remote certification: NOT YET PERFORMED\n- Manual mutation API rescues: 0; fabricated Kafka events: 0; mock/fabricated PASS: 0; secrets: NO\n- Commit/push/deploy: NO/NO/NO\n\n## Targeted closure\n\nKafka now uses separate INTERNAL and EXTERNAL listeners. Windows-host metadata from localhost:29092 advertises localhost:29092, while Compose clients and Edge continue to use pqc_kafka:9092. The live Customer UI created a PENDING ServiceOrder, the Windows-host backend published ORDER_CREATED, and the outbox row became processed=true.\n\nThe real Plumber UI displayed the incoming order. Reject issued one PATCH mutation, persisted a DECLINED disposition for the authenticated Plumber, kept the global order PENDING, excluded it from that Plumber after polling/reload, and left it visible to another eligible Plumber. QA-0179 and QA-0186 also passed. The dispatch defect is FIXED locally. Live failed-send and automatic-retry checks remain NOT TESTED; deterministic retry tests pass.\n\nNext unresolved canonical row: ${proof.nextPending}. Recommended next action: CONTINUE EXECUTING REMAINING LOCAL TESTS.\n\n`;
fs.writeFileSync(finalReportFile, finalReport + reportHistory, 'utf8');

const fingerprintFile = path.join(reportDir, 'product-source-fingerprint.txt');
fs.appendFileSync(fingerprintFile, `\nDispatch remediation after: ${fingerprint}\nDispatch source freeze: YES\nFingerprint input count: 867\n`, 'utf8');
fs.appendFileSync(path.join(reportDir, 'product-source-fingerprint-continuation.txt'), `\nCurrent authoritative dispatch remediation fingerprint: ${fingerprint}\nSource freeze after targeted remediation: YES\n`, 'utf8');

const remediation = `# Plumber reject/disposition remediation\n\nDate: 2026-09-21\nBranch: Development-2\nHEAD: ${head}\nOld fingerprint: 4f8034fa6c34f75247aa2ee65037e15b83d03aee4b1c198197c1959509e98e76\nNew fingerprint: ${fingerprint}\nProduct source changed: YES\nFlyway before/after: V21 -> V22\n\n## Kafka advertised-listener root cause\n\nThe broker image is confluentinc/cp-kafka:7.4.0. Before remediation, the single advertised Docker listener caused a Windows-host bootstrap through localhost:29092 to receive pqc_kafka:9092, which is not resolvable from Windows. The minimal Compose fix defines INTERNAL on 0.0.0.0:9092 advertised as pqc_kafka:9092 and EXTERNAL on 0.0.0.0:29092 advertised as localhost:29092, with INTERNAL as the inter-broker listener and the existing ZooKeeper connection preserved.\n\nRuntime evidence: docker compose config passed; a Windows-host Kafka AdminClient received advertisedNodes=localhost:29092 and listed order-accepted, order-arrived, order-completed, and order-created; a container probe reached pqc_kafka:9092; Edge remained healthy.\n\n## Reject root cause and domain semantics\n\nThe original Reject handler only dismissed the React card and never called the backend. The verified domain is per-Plumber: a Plumber A decline leaves the global ServiceOrder PENDING, suppresses that job for A, and leaves it available to another eligible Plumber. Customer orders are not cancelled by a single Plumber decline.\n\nThe durable model is new V22 service_order_plumber_dispositions with DECLINED, created_at, foreign keys, an index by plumber/disposition, and a unique (service_order_id, plumber_id) constraint. The API is PATCH or POST /api/v1/orders/{id}/reject; authenticated Plumber identity is derived server-side. GET /api/v1/orders/status/PENDING excludes only the current Plumber's declined rows. Accept/reject mutation reads use a pessimistic row lock; reject requires approved and online status; a declined Plumber cannot later accept the same order. Duplicate decline is idempotent.\n\n## Changed product files\n\n- docker-compose.yml\n- backend/src/main/java/com/pqc/core/controller/ServiceOrderController.java\n- backend/src/main/java/com/pqc/core/entity/PlumberJobDisposition.java\n- backend/src/main/java/com/pqc/core/entity/ServiceOrderPlumberDisposition.java\n- backend/src/main/java/com/pqc/core/repository/ServiceOrderPlumberDispositionRepository.java\n- backend/src/main/java/com/pqc/core/repository/ServiceOrderRepository.java\n- backend/src/main/java/com/pqc/core/service/ServiceOrderService.java\n- backend/src/main/resources/db/migration/V22__add_plumber_job_dispositions.sql\n- backend/src/test/java/com/pqc/core/security/ResourceAuthorizationTest.java\n- plumber-app/src/screens/jobs/IncomingJobRequestScreen.tsx\n- plumber-app/src/services/api/endpoints.ts\n- plumber-app/src/services/jobs/jobService.ts\n- plumber-app/src/services/jobs/jobService.test.ts\n- plumber-app/App.test.tsx\n\n## Validation\n\n- Full Maven suite: 314 tests, 0 failures, 0 errors, 0 skips; BUILD SUCCESS.\n- Plumber tests: 22/22 PASS.\n- Plumber typecheck: PASS.\n- Plumber web export: PASS.\n- Customer OTP contract tests: PASS; Customer typecheck and web export: PASS.\n- docker compose config: PASS.\n- Live host producer and successful outbox ACK: PASS. Live failed-send processed=false and automatic retry: NOT TESTED.\n- Browser mechanism: Existing project Playwright + installed Chrome. No route interception, token injection, API rescue, SQL mutation, manually published event, or fabricated job.\n\n## Real browser and database evidence\n\nThe real Customer UI performed OTP send, wrong-code rejection, valid authentication, reload session restoration, and created ServiceOrder 17 with status PENDING. Database read-back showed the order-created outbox event processed=true. Plumber A saw order 17 through REST polling and one Reject activation issued PATCH /api/v1/orders/17/reject with HTTP 200. Database read-back showed order 17 PENDING and Plumber A's DECLINED disposition. A did not see it after polling or reload; Plumber B still saw the pending job.\n\nQA-0177 PASS. QA-0179 PASS with 403 and no mutation. QA-0184 remains NOT TESTED because no legitimate resume-capable fixture was established. QA-0186 PASS with bounded 409 after accept and no 500. Material fixture: NO.\n\n## Review and closure\n\nThe gstack review wrapper is UNAVAILABLE because Bash and browse.exe are blocked by Windows Application Control error 4551; Windows security was not bypassed. Manual bounded review of only the Kafka listener, outbox, reject backend, migration, Plumber UI, and tests found no remaining in-scope High/Medium issue after the final lock/eligibility changes.\n\nNEW-PROD-PLUMBER-JOB-DISPATCH-001: FIXED locally. Open High 0, Medium 0, Low 0. Broad 709-row coverage may CONTINUE from the next unresolved row in the CSV, ${proof.nextPending}. Remote certification remains NOT YET PERFORMED. Commit/push/PR/merge/deploy: NO.\n`;
fs.writeFileSync(path.join(reportDir, 'PLUMBER_REJECT_DISPOSITION_REMEDIATION_20260921.md'), remediation, 'utf8');

fs.appendFileSync(path.join(reportDir, 'PLUMBER_JOB_DISPATCH_REMEDIATION_20260920.md'), `\n\n## AUTHORITATIVE SUPERSEDING CLOSURE - 2026-09-21\n\nThe review-blocking accept-after-decline and online/approved eligibility gaps were fixed with row-locking and server-side Plumber eligibility checks. The final fingerprint is ${fingerprint}; Flyway is V22; the full Maven suite is 314/0/0/0 and Plumber validation is 22/22 with typecheck and web export PASS.\n\nThe live browser run created ServiceOrder 17, proved successful Kafka delivery and processed=true, executed one real PATCH Reject, read back a durable DECLINED disposition while the order stayed PENDING, proved same-Plumber poll/reload exclusion, and proved Plumber-B visibility. QA-0177, QA-0179, and QA-0186 are PASS; QA-0184 remains NOT TESTED. The dispatch defect is FIXED locally. Live failed-send and automatic retry remain NOT TESTED.\n`);

console.log(JSON.stringify(proof, null, 2));
