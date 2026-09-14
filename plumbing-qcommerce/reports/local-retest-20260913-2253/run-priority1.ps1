$retDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$csv = Join-Path $retDir 'retest-master-prioritized.csv'
if (-not (Test-Path $csv)) { Write-Error "CSV not found: $csv"; exit 1 }
$rows = Import-Csv $csv
$priorityRows = $rows | Where-Object { $_.Priority -eq '1' }
if (-not $priorityRows) { Write-Host "No Priority=1 rows found in $csv"; exit 0 }
$scenarios = $priorityRows | Select-Object -ExpandProperty Scenario -Unique
Write-Host "Found $($scenarios.Count) unique Priority=1 scenarios:`n"
$scenarios | ForEach-Object { Write-Host " - $_" }
function EscapeRegex($s){ return [regex]::Escape($s) }
$patterns = $scenarios | ForEach-Object { EscapeRegex($_) }
$regex = ($patterns -join '|')
Write-Host "`nGenerated grep regex:`n$regex`n"
$cmd = 'cd admin-portal; npx playwright test --grep "' + $regex + '" --retries=1'
Write-Host "Dry-run command to execute Playwright tests (copy & run inside project root):`n$cmd`n"

# Auto-execute the command and stream output to a log file
$log = Join-Path $retDir 'priority1-playwright.log'
Write-Host "Executing Playwright command and logging to: $log`n"
$projRoot = Split-Path (Split-Path $retDir -Parent) -Parent
$adminDir = Join-Path $projRoot 'admin-portal'
if (-not (Test-Path $adminDir)) { Write-Error "Admin portal path not found: $adminDir"; exit 1 }
Push-Location $adminDir
try {
	$playCmd = 'npx playwright test --grep "' + $regex + '" --retries=1'
	Write-Host "Running: $playCmd`n"
	Invoke-Expression $playCmd 2>&1 | Tee-Object -FilePath $log
} finally {
	Pop-Location
}