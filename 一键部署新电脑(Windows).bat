@echo off
chcp 65001 >nul
cd /d "%~dp0"
title DPSir 个人网盘 - Windows 部署向导

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ===============================================================
    echo       DPSir 个人网盘 - Windows 部署向导
    echo ===============================================================
    echo.
    echo [提示] 正在请求管理员权限以配置系统防火墙与开机自启...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Start-Process powershell.exe -ArgumentList '-NoExit -NoProfile -ExecutionPolicy Bypass -File \"\"%~dp0scripts\setup-new-windows-host.ps1\"\"' -Verb RunAs -ErrorAction Stop; exit 0 } catch { Write-Host '  [提示] 未获取管理员权限，正在以当前用户权限继续运行部署向导...' -ForegroundColor Yellow; & powershell.exe -NoExit -NoProfile -ExecutionPolicy Bypass -File \"%~dp0scripts\setup-new-windows-host.ps1\" }"
    if %errorlevel% neq 0 (
        echo.
        echo [提示] 向导执行遇到问题，请按任意键退出...
        pause >nul
    )
    exit /b
)

:: 已具有管理员权限
powershell.exe -NoExit -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-new-windows-host.ps1"
echo.
echo ===============================================================
echo   向导执行完毕，按任意键退出...
echo ===============================================================
pause >nul
exit /b
