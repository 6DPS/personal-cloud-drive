@echo off
chcp 65001 >nul
cd /d "%~dp0"

net session >nul 2>&1
if %errorlevel% == 0 goto :RUN_ADMIN

echo ===============================================================
echo   DPSir 个人网盘 - Windows 小主机/新电脑 一键部署向导
echo ===============================================================
echo.
echo [提示] 正在请求管理员权限以全自动配置防火墙与开机自启...
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Start-Process -FilePath '%~f0' -Verb RunAs } catch { Write-Host '[提示] 已取消管理员授权。若要全自动配置，请重新双击并点击【是】。' -ForegroundColor Yellow; Start-Sleep -Seconds 3 }"
exit /b

:RUN_ADMIN
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-new-windows-host.ps1"
echo.
echo [向导执行完毕] 按回车键退出...
pause >nul
exit /b
