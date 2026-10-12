@echo off
cd /d "%~dp0"
echo Starting CATCH Project...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run.ps1"
pause
