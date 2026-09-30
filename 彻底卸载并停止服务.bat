@echo off
chcp 65001 >nul
cd /d "%~dp0"
title DPSir 个人网盘 - 彻底卸载并停止服务
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\uninstall-lan-autostart.ps1"
echo.
echo 按任意键退出...
pause >nul
