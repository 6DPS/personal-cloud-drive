@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ===============================================================
echo        DPSir 个人网盘 - GitHub 云端同步与热更新助手
echo ===============================================================
echo.

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 系统未安装 Git，请先安装 Git！
    pause
    exit /b 1
)

if not exist "%~dp0.git" (
    echo [1/3] 正在全自动关联 GitHub 云端开源仓库...
    git init
    git remote add origin https://github.com/6DPS/personal-cloud-drive.git
    git fetch origin
    git reset --hard origin/main
    git branch -M main
    git branch --set-upstream-to=origin/main main
    echo [成功] 云端关联完成！
) else (
    echo [1/3] 正在从 GitHub 云端拉取最新更新 (git pull)...
    git pull
)

echo.
echo [2/3] 正在检查依赖完整性 (npm install --omit=dev)...
call npm install --omit=dev

echo.
echo [3/3] 正在平滑重启网盘服务与公网隧道...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\restart-all-services.ps1"

echo.
echo ===============================================================
echo              ✓ 全部更新并重启成功！
echo ===============================================================
echo.
pause
