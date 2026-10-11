@echo off
chcp 65001 >nul
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-cloudflare-domain.ps1"
echo.
echo Press any key to exit...
pause >nul
