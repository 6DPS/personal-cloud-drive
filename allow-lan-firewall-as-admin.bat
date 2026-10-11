@echo off
cd /d "%~dp0"
title DPSir Cloud Drive - Firewall Configuration

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ===============================================================
    echo       DPSir Cloud Drive - Windows Firewall Setup
    echo ===============================================================
    echo.
    echo [INFO] Requesting Administrator privileges to allow TCP port 8081...
    powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "try { Start-Process powershell.exe -ArgumentList '-NoExit -NoProfile -ExecutionPolicy Bypass -File \"\"%~dp0scripts\allow-lan-firewall.ps1\"\"' -Verb RunAs -ErrorAction Stop; exit 0 } catch { Write-Host '  [ERROR] Administrator privileges are required to modify Windows Firewall rules.' -ForegroundColor Red; pause }"
    exit /b
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\allow-lan-firewall.ps1"
echo.
echo ===============================================================
echo   Firewall configuration complete. Press any key to exit...
echo ===============================================================
pause >nul
exit /b
