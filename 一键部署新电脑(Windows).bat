@echo off
chcp 65001 >nul
cd /d "%~dp0"
title DPSir 个人网盘 - Windows 部署向导

:: 检查是否具备管理员权限
net session >nul 2>&1
if %errorlevel% equ 0 goto :RUN_AS_ADMIN

:: 未具备管理员权限时，申请 UAC 提权并在独立管理员窗口中运行
echo ===============================================================
echo       DPSir 个人网盘 - Windows 部署向导
echo ===============================================================
echo.
echo [提示] 正在请求管理员权限以配置系统防火墙与开机自启...

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "try { Start-Process powershell.exe -ArgumentList '-NoExit -NoProfile -ExecutionPolicy Bypass -File \"\"%~dp0scripts\setup-new-windows-host.ps1\"\"' -Verb RunAs -ErrorAction Stop; exit 0 } catch { exit 1 }"
if %errorlevel% equ 0 exit /b

:: 用户取消了 UAC 弹窗时，在当前控制台窗口以普通用户权限降级运行
echo.
echo [提示] 未获取管理员权限，正在以当前用户普通权限继续运行向导...
echo.

:RUN_AS_ADMIN
powershell.exe -NoExit -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-new-windows-host.ps1"
exit /b
