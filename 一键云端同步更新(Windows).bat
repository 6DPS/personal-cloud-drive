@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ===============================================================
echo          DPSir 个人网盘 - 一键云端同步与热更新助手
echo ===============================================================
echo.

where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 当前电脑未安装 Git 工具，请先安装 Git！
    pause
    exit /b 1
)

if not exist "%~dp0.git" goto init_git

:do_pull
echo [1/3] 正在从 GitHub 云端拉取最新代码更新...
git pull
if %errorlevel% neq 0 (
    echo [提示] 正在执行云端代码强制对齐...
    git fetch origin
    git reset --hard origin/main
)
goto do_install

:init_git
echo [1/3] 正在全自动关联 GitHub 云端仓库...
git init
git remote add origin https://github.com/6DPS/personal-cloud-drive.git
git fetch origin
git reset --hard origin/main
git branch -M main
git branch --set-upstream-to=origin/main main
echo [完成] 云端仓库关联成功！

:do_install
echo.
echo [2/3] 正在检查依赖完整性...
call npm install --omit=dev

echo.
echo [3/3] 正在平滑重启网盘服务与公网隧道...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\restart-all-services.ps1"

echo.
echo ===============================================================
echo            全部更新并重启成功！请刷新网页体验！
echo ===============================================================
echo.
pause
