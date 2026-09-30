@echo off
chcp 65001 >nul
cd /d "%~dp0"
title DPSir 个人网盘 - 访问地址速查
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\show-addresses.ps1"
echo.
echo 按任意键退出...
pause >nul
