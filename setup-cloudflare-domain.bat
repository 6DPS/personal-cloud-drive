@echo off
chcp 65001 >nul
cd /d "%~dp0"
title DPSir Personal Cloud Drive - Cloudflare Tunnel Setup
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-cloudflare-domain.ps1"
echo.
echo Press any key to exit...
pause >nul
