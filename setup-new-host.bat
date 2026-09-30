@echo off
setlocal
cd /d "%~dp0"

net session >nul 2>&1
if %errorlevel% == 0 goto :RUN_ADMIN

echo ===============================================================
echo   DPSir Personal Cloud Drive - One-Click Setup
echo ===============================================================
echo.
echo [Notice] Requesting Administrator privileges for one-click setup...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "try { Start-Process powershell.exe -Verb RunAs -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"\"%~dp0scripts\setup-new-windows-host.ps1\"\"' } catch { Write-Host '[Notice] Administrator elevation was canceled. Please re-run as administrator.' -ForegroundColor Yellow; Start-Sleep -Seconds 3 }"
exit /b

:RUN_ADMIN
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-new-windows-host.ps1"
exit /b
