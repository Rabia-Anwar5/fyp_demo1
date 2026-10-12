# CATCH - One-Click Native Startup Script (Windows PowerShell)
# Runs the full backend and web app without requiring Docker or external daemons.

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "     CATCH - Retail Assistant (Local Dev Server)          " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# Resolve script root directory reliably
$ScriptRoot = $PSScriptRoot
if (-not $ScriptRoot) {
    if ($MyInvocation.MyCommand.Path) {
        $ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
    } else {
        $ScriptRoot = $PWD.Path
    }
}
# If executed from parent directory
if (-not (Test-Path "$ScriptRoot\ai-service") -and (Test-Path "$ScriptRoot\catch\ai-service")) {
    $ScriptRoot = "$ScriptRoot\catch"
}

# Verify prerequisites
$hasPython = Get-Command "python" -ErrorAction SilentlyContinue
$hasNode   = Get-Command "node" -ErrorAction SilentlyContinue

if (-not $hasPython) {
    Write-Host "[ERROR] 'python' was not found in PATH. Please install Python 3.10+ and add it to PATH." -ForegroundColor Red
    exit 1
}
if (-not $hasNode) {
    Write-Host "[ERROR] 'node' was not found in PATH. Please install Node.js 18+ and add it to PATH." -ForegroundColor Red
    exit 1
}

# 1. Kill any existing instances on port 8000 and 3001
Get-NetTCPConnection -LocalPort 8000, 3001 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}

# 2. Start AI Service (FastAPI)
Write-Host "[1/3] Starting AI Inference Service (Port 8000)..." -ForegroundColor Green
$aiJob = Start-Process -FilePath "python" -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000" -WorkingDirectory "$ScriptRoot\ai-service" -PassThru -NoNewWindow

# 3. Start Logic Service (Node.js)
Write-Host "[2/3] Starting Logic & Deal Service (Port 3001)..." -ForegroundColor Green
$logicJob = Start-Process -FilePath "node" -ArgumentList "dist/index.js" -WorkingDirectory "$ScriptRoot\logic-service" -PassThru -NoNewWindow

# 4. Verification Check with Retries (allowing AI models to load)
Write-Host "[3/3] Verifying Backend Services (waiting for model init)..." -ForegroundColor Green

$aiReady = $false
$logicReady = $false

for ($i = 1; $i -le 30; $i++) {
    Start-Sleep -Seconds 1

    # Check for early process exit
    if ($aiJob.HasExited) {
        Write-Host "  -> ERROR: AI Service process stopped unexpectedly (Exit Code: $($aiJob.ExitCode))." -ForegroundColor Red
        break
    }
    if ($logicJob.HasExited) {
        Write-Host "  -> ERROR: Logic Service process stopped unexpectedly (Exit Code: $($logicJob.ExitCode))." -ForegroundColor Red
        break
    }

    if (-not $aiReady) {
        try {
            $aiHealth = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/health" -Method Get -TimeoutSec 2
            $aiReady = $true
            Write-Host "  -> AI Service is LIVE at http://127.0.0.1:8000 (Swagger: /docs)" -ForegroundColor Cyan
        } catch {}
    }
    if (-not $logicReady) {
        try {
            $logicHealth = Invoke-RestMethod -Uri "http://127.0.0.1:3001/api/v1/health" -Method Get -TimeoutSec 2
            $logicReady = $true
            Write-Host "  -> Logic Service & Web App LIVE at http://127.0.0.1:3001" -ForegroundColor Cyan
        } catch {}
    }
    if ($aiReady -and $logicReady) {
        break
    }
}

if ($aiReady -and $logicReady) {
    Write-Host "`n==========================================================" -ForegroundColor Cyan
    Write-Host "  ALL SERVICES RUNNING SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "  - Web Application:  http://localhost:3001" -ForegroundColor Yellow
    Write-Host "  - AI Service Docs:  http://localhost:8000/docs" -ForegroundColor Gray
    Write-Host "  - Mobile App:       npm run mobile (in ./catch)" -ForegroundColor Gray
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop all servers.`n" -ForegroundColor DarkYellow

    # Auto-open browser
    try {
        Start-Process "http://localhost:3001"
    } catch {}
} else {
    Write-Host "`n==========================================================" -ForegroundColor Red
    Write-Host "  STARTUP WARNING: Some services failed to respond:" -ForegroundColor Red
    if (-not $aiReady)    { Write-Host "  - AI Service (Port 8000) did not become ready." -ForegroundColor Yellow }
    if (-not $logicReady) { Write-Host "  - Logic Service (Port 3001) did not become ready." -ForegroundColor Yellow }
    Write-Host "==========================================================" -ForegroundColor Red
}

# Keep the script active so child processes remain alive
try {
    while ($true) {
        Start-Sleep -Seconds 2
        # Check if child processes are still running
        if ($aiJob.HasExited -or $logicJob.HasExited) {
            Write-Host "`nOne of the services stopped." -ForegroundColor Red
            break
        }
    }
} finally {
    Write-Host "`nStopping CATCH background services..." -ForegroundColor Yellow
    if ($aiJob -and -not $aiJob.HasExited) { Stop-Process -Id $aiJob.Id -Force -ErrorAction SilentlyContinue }
    if ($logicJob -and -not $logicJob.HasExited) { Stop-Process -Id $logicJob.Id -Force -ErrorAction SilentlyContinue }
    # Also clean ports just in case
    Get-NetTCPConnection -LocalPort 8000, 3001 -ErrorAction SilentlyContinue | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Write-Host "All services stopped." -ForegroundColor Green
}
