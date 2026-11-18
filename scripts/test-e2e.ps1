[CmdletBinding()]
param(
    [ValidateSet("1", "2", "3", "4", "all")]
    [string]$Tier = "all",

    [ValidateSet("auto", "live", "mock")]
    [string]$Mode = "auto",

    [switch]$VerboseOutput,
    [switch]$Bail,
    [string]$Filter = ""
)

$ErrorActionPreference = "Continue"

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host " Project EARLY — E2E Test Suite Orchestrator" -ForegroundColor Cyan
Write-Host "=======================================================`n" -ForegroundColor Cyan

$SpringUrl = "http://localhost:8080/api/v1/auth/me"
$OcrUrl = "http://localhost:8000/health"

$SpringUp = $false
$OcrUp = $false

if ($Mode -ne "mock") {
    Write-Host "[*] Probing Spring Boot backend on http://localhost:8080 ..." -NoNewline
    try {
        $res = Invoke-WebRequest -Uri $SpringUrl -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($res.StatusCode -eq 401 -or $res.StatusCode -eq 200) {
            $SpringUp = $true
            Write-Host " [ONLINE]" -ForegroundColor Green
        } else {
            Write-Host " [OFFLINE]" -ForegroundColor Yellow
        }
    } catch {
        if ($_.Exception.Response -and ($_.Exception.Response.StatusCode -eq 401 -or $_.Exception.Response.StatusCode -eq 200)) {
            $SpringUp = $true
            Write-Host " [ONLINE]" -ForegroundColor Green
        } else {
            Write-Host " [OFFLINE]" -ForegroundColor Yellow
        }
    }

    Write-Host "[*] Probing FastAPI OCR service on http://localhost:8000 ..." -NoNewline
    try {
        $res = Invoke-WebRequest -Uri $OcrUrl -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
        if ($res.StatusCode -eq 200) {
            $OcrUp = $true
            Write-Host " [ONLINE]" -ForegroundColor Green
        } else {
            Write-Host " [OFFLINE]" -ForegroundColor Yellow
        }
    } catch {
        Write-Host " [OFFLINE]" -ForegroundColor Yellow
    }
}

# Determine effective execution mode
$ResolvedMode = "mock"
if ($Mode -eq "live") {
    if (-not $SpringUp -or -not $OcrUp) {
        Write-Host "`n[ERROR] Live mode requested but one or more required services are not running!" -ForegroundColor Red
        Write-Host "  Spring Boot (:8080): $(if ($SpringUp) {'ONLINE'} else {'OFFLINE'})"
        Write-Host "  FastAPI OCR (:8000): $(if ($OcrUp) {'ONLINE'} else {'OFFLINE'})"
        exit 1
    }
    $ResolvedMode = "live"
    Write-Host "[+] Live services online -> running in LIVE HTTP mode.`n" -ForegroundColor Green
} elseif ($Mode -eq "auto") {
    if ($SpringUp -and $OcrUp) {
        $ResolvedMode = "live"
        Write-Host "[+] Both live services detected -> running in LIVE HTTP mode.`n" -ForegroundColor Green
    } else {
        $ResolvedMode = "mock"
        Write-Host "[!] Live services not online -> running in HIGH-FIDELITY SIMULATION mode.`n" -ForegroundColor Yellow
    }
} else {
    $ResolvedMode = "mock"
    Write-Host "[*] Explicit MOCK simulation mode selected.`n" -ForegroundColor Gray
}

# Assemble Node command arguments
$NodeArgs = @("scripts/e2e/runner.mjs", "--tier=$Tier", "--mode=$ResolvedMode")
if ($VerboseOutput) { $NodeArgs += "--verbose" }
if ($Bail) { $NodeArgs += "--bail" }
if ($Filter -ne "") { $NodeArgs += "--filter=$Filter" }

Write-Host "[*] Executing: node $($NodeArgs -join ' ')`n" -ForegroundColor Gray

# Set environment variables and invoke runner
$env:NODE_ENV = "test"
$env:E2E_MODE = $ResolvedMode

& node $NodeArgs

$RunnerExitCode = $LASTEXITCODE
Write-Host "`n[*] Test runner finished with exit code: $RunnerExitCode" -ForegroundColor $(if ($RunnerExitCode -eq 0) { 'Green' } else { 'Red' })
exit $RunnerExitCode
