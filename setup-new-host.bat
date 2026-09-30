@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

net session >nul 2>&1
if %errorlevel% == 0 goto :RUN_ADMIN

echo ===============================================================
echo   DPSir 个人网盘 - Windows 小主机/新电脑 一键部署向导
echo ===============================================================
echo.
echo [提示] 正在请求管理员权限以全自动配置防火墙与开机自启...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "try { Start-Process powershell.exe -Verb RunAs -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"\"%~dp0scripts\setup-new-windows-host.ps1\"\"' } catch { Write-Host '[提示] 已取消管理员授权，请重新运行并点击【是】以完成部署。' -ForegroundColor Yellow; Start-Sleep -Seconds 3 }"
exit /b

:RUN_ADMIN
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-new-windows-host.ps1"
exit /b
