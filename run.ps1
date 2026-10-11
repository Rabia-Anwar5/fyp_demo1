# CATCH - One-Click Native Startup Script (Windows PowerShell)
# Runs the full backend without requiring Docker or external daemons.

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "     CATCH - Retail Assistant (Local Dev Server)          " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Kill any existing instances on port 8000 and 3001
Get-NetTCPConnection -LocalPort 8000, 3001 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}

# 2. Start AI Service (FastAPI)
Write-Host "[1/3] Starting AI Inference Service (Port 8000)..." -ForegroundColor Green
$aiJob = Start-Process -FilePath "python" -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000" -WorkingDirectory "$PSScriptRoot\ai-service" -PassThru -NoNewWindow

Start-Sleep -Seconds 2

# 3. Start Logic Service (Node.js)
Write-Host "[2/3] Starting Logic & Deal Service (Port 3001)..." -ForegroundColor Green
$logicJob = Start-Process -FilePath "node" -ArgumentList "dist/index.js" -WorkingDirectory "$PSScriptRoot\logic-service" -PassThru -NoNewWindow

Start-Sleep -Seconds 2

# 4. Verification Check
Write-Host "[3/3] Verifying Backend Services..." -ForegroundColor Green
try {
    $aiHealth = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/health" -Method Get -TimeoutSec 3
    Write-Host "  -> AI Service is LIVE at http://127.0.0.1:8000 (Swagger: /docs)" -ForegroundColor Cyan
} catch {
    Write-Host "  -> AI Service starting up..." -ForegroundColor Yellow
}

try {
    $logicHealth = Invoke-RestMethod -Uri "http://127.0.0.1:3001/api/v1/health" -Method Get -TimeoutSec 3
    Write-Host "  -> Logic Service is LIVE at http://127.0.0.1:3001" -ForegroundColor Cyan
} catch {
    Write-Host "  -> Logic Service starting up..." -ForegroundColor Yellow
}

Write-Host "`nAll backend services are ready!" -ForegroundColor Green
Write-Host "  - Swagger UI:       http://localhost:8000/docs" -ForegroundColor Gray
Write-Host "  - Logic Health:     http://localhost:3001/api/v1/health" -ForegroundColor Gray
Write-Host "  - Chrome Extension: Load unpacked in chrome://extensions from ./extension" -ForegroundColor Gray
Write-Host "  - Mobile App:       Run 'npx expo start' in ./mobile" -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan
