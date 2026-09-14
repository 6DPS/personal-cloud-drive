@echo off
chcp 65001 >nul
title DPSir 个人网盘 - 换机迁移与数据打包助手
cd /d "%~dp0"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "scripts\export-drive-package.ps1"

echo.
pause
