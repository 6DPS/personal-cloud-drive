@echo off
chcp 65001 >nul
cd /d "%~dp0"
title DPSir 个人网盘 - 防火墙放行配置

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ===============================================================
    echo       DPSir 个人网盘 - Windows 防火墙配置
    echo ===============================================================
    echo.
    echo [提示] 正在请求管理员权限以放行 TCP 8081 端口...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Start-Process powershell.exe -ArgumentList '-NoExit -NoProfile -ExecutionPolicy Bypass -File \"\"%~dp0scripts\allow-lan-firewall.ps1\"\"' -Verb RunAs -ErrorAction Stop; exit 0 } catch { Write-Host '  [错误] 必须授予管理员权限才能修改 Windows 防火墙规则。' -ForegroundColor Red; pause }"
    exit /b
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\allow-lan-firewall.ps1"
echo.
echo ===============================================================
echo   配置完毕，按任意键退出...
echo ===============================================================
pause >nul
exit /b
