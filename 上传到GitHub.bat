@echo off
title DPSir 个人网盘 - 一键推送到 GitHub
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "scripts\push-to-github.ps1"
echo.
pause
