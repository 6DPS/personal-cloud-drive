@echo off
chcp 65001 >nul
cd /d "%~dp0"
title DPSir Personal Cloud Drive - Windows Setup Wizard

:: Check for Administrator privileges
net session >nul 2>&1
if %errorlevel% equ 0 goto :RUN_AS_ADMIN

:: Request UAC elevation and run in an elevated window
echo ===============================================================
echo       DPSir Personal Cloud Drive - Windows Setup Wizard
echo ===============================================================
echo.
echo [INFO] Requesting Administrator privileges to configure Firewall and Auto-start...

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "try { Start-Process powershell.exe -ArgumentList '-NoExit -NoProfile -ExecutionPolicy Bypass -File \"\"%~dp0scripts\setup-new-windows-host.ps1\"\"' -Verb RunAs -ErrorAction Stop; exit 0 } catch { exit 1 }"
if %errorlevel% equ 0 exit /b

:: Fallback to normal user privileges if UAC prompt was cancelled
echo.
echo [WARN] Administrator privileges not granted. Continuing with standard user privileges...
echo.

:RUN_AS_ADMIN
powershell.exe -NoExit -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-new-windows-host.ps1"
exit /b
