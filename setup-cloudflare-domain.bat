@echo off
chcp 65001 >nul
cd /d "%~dp0"
title DPSir 个人网盘 - Cloudflare 域名公网配置
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-cloudflare-domain.ps1"
echo.
echo 按任意键退出...
pause >nul
