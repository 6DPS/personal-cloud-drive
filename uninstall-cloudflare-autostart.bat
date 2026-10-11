@echo off
chcp 65001 >nul
cd /d "%~dp0"
title DPSir Personal Cloud Drive - Uninstall Cloudflare Autostart
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\uninstall-cloudflare-autostart.ps1"
echo.
echo Press any key to exit...
pause >nul
