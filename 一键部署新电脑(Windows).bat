@echo off
chcp 65001 >nul
cd /d "%~dp0"

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [提示] 正在请求管理员权限以全自动配置 Windows 防火墙与自启服务...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -ExecutionPolicy Bypass -Command ""& ''%~dp0scripts\setup-new-windows-host.ps1''; Write-Host ''`n[向导执行完毕] 按任意键退出...''; [Console]::ReadKey() > $null""' } catch { Write-Host ''`n[提示] 您取消了管理员授权。若要全自动配置防火墙与开机自启，请重新运行并点击【是】。'' -ForegroundColor Yellow; Write-Host ''按任意键退出...''; [Console]::ReadKey() > $null }"
    exit /b
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-new-windows-host.ps1"
echo.
echo [向导执行完毕] 按任意键退出...
pause >nul
