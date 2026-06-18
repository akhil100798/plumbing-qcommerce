$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = Split-Path -Parent $PSScriptRoot

function Invoke-VerificationStep {
    param(
        [Parameter(Mandatory)]
        [string] $Name,

        [Parameter(Mandatory)]
        [scriptblock] $Command
    )

    Write-Host "`n==> $Name"
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Name failed with exit code $LASTEXITCODE."
    }
}

function Invoke-InDirectory {
    param(
        [Parameter(Mandatory)]
        [string] $Path,

        [Parameter(Mandatory)]
        [scriptblock] $Command
    )

    Push-Location $Path
    try {
        & $Command
    }
    finally {
        Pop-Location
    }
}

try {
    Set-Location $repoRoot

    $serverVersion = & docker version --format '{{.Server.Version}}'
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace(($serverVersion | Out-String))) {
        throw 'Docker daemon is unavailable.'
    }
    Write-Host "Docker server: $serverVersion"

    Invoke-VerificationStep 'Validate Docker Compose configuration' {
        docker compose config --quiet
    }

    $expectedServices = @(& docker compose config --services)
    if ($LASTEXITCODE -ne 0 -or $expectedServices.Count -eq 0) {
        throw 'Could not determine Docker Compose services.'
    }

    $serviceStatus = @(& docker compose ps --format json | ConvertFrom-Json)
    if ($LASTEXITCODE -ne 0) {
        throw 'Could not read Docker Compose service health.'
    }

    foreach ($serviceName in $expectedServices) {
        $status = $serviceStatus | Where-Object Service -eq $serviceName
        if ($null -eq $status) {
            throw "Docker Compose service '$serviceName' is not running."
        }
        if ($status.State -ne 'running') {
            throw "Docker Compose service '$serviceName' is $($status.State), not running."
        }
        if (-not [string]::IsNullOrWhiteSpace($status.Health) -and $status.Health -ne 'healthy') {
            throw "Docker Compose service '$serviceName' is $($status.Health)."
        }
    }

    Invoke-VerificationStep 'Run backend Maven tests' {
        Invoke-InDirectory (Join-Path $repoRoot 'backend') { .\mvnw.cmd test }
    }

    Invoke-VerificationStep 'Install edge dependencies' {
        Invoke-InDirectory (Join-Path $repoRoot 'edge-service') { npm.cmd ci }
    }
    Invoke-VerificationStep 'Run edge tests' {
        Invoke-InDirectory (Join-Path $repoRoot 'edge-service') { npm.cmd test }
    }

    Invoke-VerificationStep 'Install admin dependencies' {
        Invoke-InDirectory (Join-Path $repoRoot 'admin-portal') { npm.cmd ci }
    }
    Invoke-VerificationStep 'Lint admin portal' {
        Invoke-InDirectory (Join-Path $repoRoot 'admin-portal') { npm.cmd run lint }
    }
    Invoke-VerificationStep 'Build admin portal' {
        Invoke-InDirectory (Join-Path $repoRoot 'admin-portal') { npm.cmd run build }
    }

    foreach ($appName in @('customer-app', 'plumber-app')) {
        Invoke-VerificationStep "Install $appName dependencies" {
            Invoke-InDirectory (Join-Path $repoRoot $appName) { npm.cmd ci }
        }
        Invoke-VerificationStep "Type-check $appName" {
            Invoke-InDirectory (Join-Path $repoRoot $appName) { npm.cmd run typecheck }
        }
    }

    Write-Host "`nLocal verification passed."
}
catch {
    Write-Error $_
    exit 1
}
