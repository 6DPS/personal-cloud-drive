@echo off
chcp 65001 >nul
cd /d "%~dp0"
title DPSir Personal Cloud Drive - Access Addresses
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\show-addresses.ps1"
echo.
echo Press any key to exit...
pause >nul
