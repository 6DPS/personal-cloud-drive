@echo off
chcp 65001 >nul
cd /d "%~dp0"
title DPSir Personal Cloud Drive - Uninstall and Stop Services
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\uninstall-lan-autostart.ps1" -NoPause
echo.
echo Press any key to exit...
pause >nul
