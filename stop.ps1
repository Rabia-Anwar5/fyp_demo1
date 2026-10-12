# CATCH - Stop all running backend services
Write-Host "Stopping CATCH services on ports 8000 and 3001..." -ForegroundColor Yellow

Get-NetTCPConnection -LocalPort 8000, 3001 -ErrorAction SilentlyContinue | ForEach-Object {
    $procId = $_.OwningProcess
    try {
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        Write-Host "Stopped process $procId" -ForegroundColor Green
    } catch {}
}

Write-Host "All CATCH services stopped." -ForegroundColor Cyan
