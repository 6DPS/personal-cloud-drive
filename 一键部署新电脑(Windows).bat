@echo off
chcp 65001 >nul
cd /d "%~dp0"

:: 检查是否具备管理员权限，没有则自动调起 UAC 一键提权
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [提示] 正在请求管理员权限以全自动配置 Windows 防火墙与自启服务...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process cmd -ArgumentList '/c cd /d """%~dp0""" && powershell.exe -NoProfile -ExecutionPolicy Bypass -File """%~dp0scripts\setup-new-windows-host.ps1""" && pause' -Verb RunAs"
    exit /b
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "scripts\setup-new-windows-host.ps1"
pause
