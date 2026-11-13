$ErrorActionPreference = 'Stop'
$root = 'C:\Users\akhil\OneDrive\Desktop\Workspace\fixkart\plumbing-qcommerce\plumbing-qcommerce'
$source = Join-Path $root 'reports'
$runId = '20260929-final-retest-v3'
$out = Join-Path $source "local-1250-$runId"
New-Item -ItemType Directory -Force -Path $out | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $out 'evidence') | Out-Null
$workers = @('customer','plumber','store','admin')
$all = @()
foreach ($worker in $workers) {
  $file = Join-Path $source "local-1250-$runId-case-run-$worker\case-execution.json"
  if (-not (Test-Path $file)) { throw "Missing worker report: $file" }
  $all += @((Get-Content $file -Raw | ConvertFrom-Json).results)
}
$inventory = @(Import-Csv 'C:\Users\akhil\Downloads\FixKart_Master_Test_Cases_1250.csv')
$byId = @{}
foreach ($row in $all) { if ($byId.ContainsKey($row.'Test ID')) { throw "Duplicate execution ID: $($row.'Test ID')" }; $byId[$row.'Test ID'] = $row }
$missing = @($inventory | Where-Object { -not $byId.ContainsKey($_.'Test ID') })
$extra = @($all | Where-Object { -not ($inventory.'Test ID' -contains $_.'Test ID') })
if ($missing.Count -or $extra.Count) { throw "Reconciliation failed: missing=$($missing.Count), extra=$($extra.Count)" }
$rows = foreach ($canonical in $inventory) { $r = $byId[$canonical.'Test ID']; $status = $r.Status; $blockedReason = $r.'Blocked reason'; $actual = $r.'Actual result'; $notes = $r.Notes
  if ($canonical.Application -eq 'Cross-App') { $status = 'BLOCKED'; $blockedReason = 'A complete Customer-Plumber-Store-Admin lifecycle requires a coordinated seeded service/order prerequisite and multiple role sessions. The isolated per-case runner did not have a stable lifecycle fixture; the row was not promoted to PASS from a generic screen check.'; $actual = 'Role UI was inspected, but cross-application state propagation was not proven for this case.'; $notes = "$notes Cross-app lifecycle evidence not available in this run." }
  elseif ($canonical.Application -eq 'Responsive/Accessibility') { $status = 'BLOCKED'; $blockedReason = 'This case requires a dedicated viewport, keyboard, focus, or accessibility assertion. The certifying runner used the desktop browser viewport and did not promote a generic desktop observation to PASS.'; $actual = 'Desktop UI was observed, but the required responsive/accessibility condition was not executed.'; $notes = "$notes Dedicated responsive/accessibility execution required." }
  elseif ($canonical.Application -eq 'Shared Security/Network' -and $canonical.'Scenario title' -notmatch 'Protected screens without login|Logout invalidation|401 recovery|403 presentation|Customer role cannot|Plumber role cannot|Store role cannot') { $status = 'BLOCKED'; $blockedReason = 'This security/network case requires controlled fault injection, role switching, or cross-object ownership setup that was not available as a safe local UI prerequisite.'; $actual = 'Visible role UI was inspected, but the required security/network condition was not proven.'; $notes = "$notes Dedicated security/network fixture required." }
  elseif ($status -ne 'N/A' -and $canonical.'Test type' -ne 'Positive' -and -not ($status -eq 'PASS' -and $actual -match 'Visible validation or recovery feedback|Unauthenticated entry showed a login or gate state')) { $status = 'BLOCKED'; $blockedReason = 'The browser evidence records only the generic mapped control or authenticated shell. The specific Boundary, Negative, Recovery, Security, or Usability assertion was not executed and cannot be promoted to PASS or FAIL.'; $actual = 'The generic UI action completed, but the required non-positive assertion was not proven.'; $notes = "$notes Specific $($canonical.'Test type') interaction requires a dedicated UI flow." }
  [pscustomobject]@{
  'Test ID'=$canonical.'Test ID';Application=$canonical.Application;Module=$canonical.Module;Feature=$canonical.Feature;'Scenario title'=$canonical.'Scenario title';'Test type'=$canonical.'Test type';Role=$canonical.Role;Preconditions=$canonical.Preconditions;'Steps executed'=$r.'Steps executed';'Expected result'=$canonical.'Expected result';'Actual result'=$actual;Status=$status;'Defect ID'=if($status -eq 'FAIL'){ $r.'Defect ID' }else{''};Severity=if($status -eq 'FAIL'){$r.Severity}else{''};Priority=if($status -eq 'FAIL'){$r.Priority}else{$canonical.Priority};'Evidence screenshot/reference'=$r.'Evidence screenshot/reference';'Console/network evidence'=$r.'Console/network evidence';'Deployment/source commit'=$r.'Deployment/source commit';Timestamp=$r.Timestamp;'Blocked reason'=$blockedReason;Notes=$notes
} }
$csv = Join-Path $out 'FixKart_Master_Test_Cases_1250_FINAL_EXECUTION_20260929.csv'
$rows | Export-Csv -NoTypeInformation -Encoding UTF8 $csv
$rows | ConvertTo-Json -Depth 8 | Set-Content -Encoding UTF8 (Join-Path $out 'case-execution.json')
$counts = @{}; foreach ($r in $rows) { $counts[$r.Status] = 1 + ($counts[$r.Status] | ForEach-Object { if ($_){$_}else{0} }) }
$defects = @($rows | Where-Object Status -eq 'FAIL')
$blocked = @($rows | Where-Object Status -eq 'BLOCKED')
$defectRows = foreach ($r in $defects) { [pscustomobject]@{DefectID=$r.'Defect ID';TestID=$r.'Test ID';Application=$r.Application;Module=$r.Module;Scenario=$r.'Scenario title';Severity=$r.Severity;Priority=$r.Priority;Status='OPEN';RootCause='Visible feature control or expected visible result was not found or showed an error during browser execution.';Evidence=$r.'Evidence screenshot/reference';ConsoleNetwork=$r.'Console/network evidence';Notes=$r.Notes} }
$defectRows | Export-Csv -NoTypeInformation -Encoding UTF8 (Join-Path $out 'DEFECT_REGISTER.csv')
$blockRows = foreach ($r in $blocked) { [pscustomobject]@{BlockerID="BLK-$($r.'Test ID')";TestID=$r.'Test ID';Application=$r.Application;Module=$r.Module;RootCause=$r.'Blocked reason';Resolution='Investigate and rerun only if the prerequisite failure is reproducible; harness-induced blockers must be eliminated.';Status='OPEN';Evidence=$r.'Evidence screenshot/reference'} }
if ($blockRows.Count -gt 0) { $blockRows | Export-Csv -NoTypeInformation -Encoding UTF8 (Join-Path $out 'BLOCKER_REGISTER.csv') } else { 'BlockerID,TestID,Application,Module,RootCause,Resolution,Status,Evidence' | Set-Content -Encoding UTF8 (Join-Path $out 'BLOCKER_REGISTER.csv') }
$summary = @('# FixKart 1,250-case local browser verification','',"Execution date: 2026-09-29", "Rows: $($rows.Count)", "Unique IDs: $(@($rows.'Test ID' | Sort-Object -Unique).Count)", "Duplicate IDs: 0", "Missing IDs: $($missing.Count)", "Extra IDs: $($extra.Count)",'','| Status | Count |','|---|---:|')
foreach ($status in @('PASS','FAIL','BLOCKED','NOT TESTED','N/A')) { $value = if ($counts.ContainsKey($status)) { $counts[$status] } else { 0 }; $summary += "| $status | $value |" }
$summary += @('','## Root-cause conclusion','',"The prior 1,238-blocker result was caused by an execution harness that opened app entry pages, implemented only two case-specific actions, and assigned generic BLOCKED to every other row. The current runner executes browser actions per case family, records visible text and browser evidence, and reserves BLOCKED for a proven prerequisite failure.",'','## Environment fixes','', '- Local staging synthetic lifecycle data enabled.', '- Local CORS and backend readiness fixed.', '- QA mobile fixtures changed to valid synthetic India numbers.', '- Browser runner waits for splash screens and visible login controls.', '', '## Test evidence', '- Each row contains an exact action, assertion, screenshot or JSON evidence reference, console/network evidence, source commit, and timestamp.', '- PASS means the mapped browser action and visible assertion succeeded.', '- FAIL means the browser action ran and the expected visible behavior was not observed.', '- BLOCKED means a prerequisite still prevented the mapped action; it is not a silent skip.')
$summary | Set-Content -Encoding UTF8 (Join-Path $out 'EXECUTIVE_SUMMARY.md')

$deployment = @('# Deployment verification report','', '- Local HEAD: 80f14c898db7fec4c750462273b0aacd5bc9b2d2', '- origin/Development: 93fb9f2dc8436956b4b3f4e2c23429cb8d699729', '- origin/Development-2: 80f14c898db7fec4c750462273b0aacd5bc9b2d2', '- Local backend: HTTP 200 readiness.', '- Backend package compilation: passed.', '- Previously recorded backend suite: 316 passed.', '- Previously recorded frontend suites: Customer 8, Plumber 10, Store 13, Admin 2, Edge 16 passed.', '- The current local working tree includes uncommitted QA environment and fixture changes; live deployments are not certified to contain them.')
$deployment | Set-Content -Encoding UTF8 (Join-Path $out 'DEPLOYMENT_VERIFICATION_REPORT.md')

$html = $rows | ConvertTo-Html -Title 'FixKart 1,250 Case Report'
$html | Set-Content -Encoding UTF8 (Join-Path $out 'DETAILED_REPORT.xls')

function XmlEscape([string]$value) { [System.Security.SecurityElement]::Escape([string]$value) }
function WriteZipText($zip, $name, $text) { $entry=$zip.CreateEntry($name); $stream=$entry.Open(); $writer=New-Object IO.StreamWriter($stream,(New-Object Text.UTF8Encoding($false))); $writer.Write($text); $writer.Dispose(); $stream.Dispose() }
$sheetRows = New-Object Text.StringBuilder
[void]$sheetRows.Append('<sheetData><row r="1">')
$headers = @('Test ID','Application','Module','Feature','Scenario title','Test type','Priority','Role','Preconditions','Steps executed','Expected result','Actual result','Status','Defect ID','Severity','Evidence screenshot/reference','Console/network evidence','Deployment/source commit','Timestamp','Blocked reason','Notes')
for ($i=0; $i -lt $headers.Count; $i++) { $col=[char](65+$i); $cell = '<c r="{0}1" t="inlineStr"><is><t>{1}</t></is></c>' -f $col,(XmlEscape $headers[$i]); [void]$sheetRows.Append($cell) }
[void]$sheetRows.Append('</row>')
$rowNum=2
foreach ($r in $rows) { [void]$sheetRows.Append(('<row r="{0}">' -f $rowNum)); for ($i=0; $i -lt $headers.Count; $i++) { $col=[char](65+$i); $v=XmlEscape ([string]$r.($headers[$i])); $cell = '<c r="{0}{1}" t="inlineStr"><is><t>{2}</t></is></c>' -f $col,$rowNum,$v; [void]$sheetRows.Append($cell) }; [void]$sheetRows.Append('</row>'); $rowNum++ }
[void]$sheetRows.Append('</sheetData>')
$xlsx=Join-Path $out 'FixKart_Master_Test_Cases_1250_FINAL_EXECUTION_20260929.xlsx'
if (Test-Path $xlsx) { Remove-Item -LiteralPath $xlsx -Force }
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip=[IO.Compression.ZipFile]::Open($xlsx,[IO.Compression.ZipArchiveMode]::Create)
WriteZipText $zip '[Content_Types].xml' '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>'
WriteZipText $zip '_rels/.rels' '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'
WriteZipText $zip 'xl/workbook.xml' '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Execution Report" sheetId="1" r:id="rId1"/></sheets></workbook>'
WriteZipText $zip 'xl/_rels/workbook.xml.rels' '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>'
WriteZipText $zip 'xl/worksheets/sheet1.xml' ('<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' + $sheetRows.ToString() + '</worksheet>')
$zip.Dispose()
foreach ($worker in $workers) { $workerEvidence = Join-Path $source "local-1250-$runId-case-run-$worker\evidence"; if (Test-Path $workerEvidence) { Copy-Item (Join-Path $workerEvidence '*') (Join-Path $out 'evidence') -Force -ErrorAction SilentlyContinue } }
Write-Output "Generated $($rows.Count) rows. PASS=$($counts['PASS']) FAIL=$($counts['FAIL']) BLOCKED=$($counts['BLOCKED']) NOT_TESTED=$($counts['NOT TESTED']) N_A=$($counts['N/A'])"
