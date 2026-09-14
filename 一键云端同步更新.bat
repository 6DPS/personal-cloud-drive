@echo off
chcp 65001 >nul
title DPSir 个人网盘 - 云端一键同步更新向导
cd /d "%~dp0"

echo ===============================================================
echo        DPSir 个人网盘 - GitHub 云端同步与热更新助手            
echo ===============================================================
echo.
echo [1/3] 正在从 GitHub 云端拉取最新代码更新 (git pull)...
git pull
if errorlevel 1 (
    echo.
    echo [提示] 拉取代码遇到异常，请检查网络或 GitHub 仓库配置。
    echo.
    pause
    exit /b 1
)

echo.
echo [2/3] 正在检查依赖完整性 (npm install --omit=dev)...
call npm install --omit=dev

echo.
echo [3/3] 正在平滑重启网盘守护服务...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& { Stop-Process -Name node -ErrorAction SilentlyContinue; Start-Sleep -Seconds 1; Start-ScheduledTask -TaskName 'DPSir Personal Cloud Drive LAN' -ErrorAction SilentlyContinue }"

echo.
echo ===============================================================
echo       🎉 恭喜！网盘已成功同步至 GitHub 最新版本并已完成重启！
echo ===============================================================
echo.
pause
