@echo off
chcp 65001 >nul
cd /d "%~dp0"
title DPSir 个人网盘 - 卸载 Cloudflare 自启动
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\uninstall-cloudflare-autostart.ps1"
echo.
echo 按任意键退出...
pause >nul
