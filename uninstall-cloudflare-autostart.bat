@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\uninstall-cloudflare-autostart.ps1"
pause
