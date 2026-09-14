@echo off
chcp 65001 >nul
title DPSir 个人网盘 - Windows小主机一键部署向导
cd /d "%~dp0"

echo 正在启动 DPSir 个人网盘一键部署向导...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "scripts\setup-new-windows-host.ps1"

echo.
pause
