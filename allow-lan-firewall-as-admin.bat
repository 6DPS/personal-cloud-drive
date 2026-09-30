@echo off
chcp 65001 >nul
cd /d "%~dp0"

net session >nul 2>&1
if %errorlevel% == 0 goto :RUN_ADMIN

echo [提示] 正在请求管理员权限以全网络放行防火墙...
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Start-Process -FilePath '%~f0' -Verb RunAs } catch { Write-Host '[提示] 已取消管理员授权。' -ForegroundColor Yellow; Start-Sleep -Seconds 3 }"
exit /b

:RUN_ADMIN
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\allow-lan-firewall.ps1"
echo.
echo [配置完毕] 按回车键退出...
pause >nul
exit /b
