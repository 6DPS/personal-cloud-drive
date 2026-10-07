@echo off
chcp 65001 >nul
cd /d "%~dp0"

where git >nul 2>nul
if %errorlevel% equ 0 (
    if not exist "%~dp0.git" (
        echo ===============================================================
        echo   检测到系统已安装 Git，正在自动为您绑定 GitHub 云端开源仓库...
        echo ===============================================================
        git init
        git remote add origin https://github.com/6DPS/personal-cloud-drive.git
        git fetch origin
        git reset --hard origin/main
        git branch -M main
        git branch --set-upstream-to=origin/main main
        echo [成功] 已自动完成云端关联！
        echo.
    )
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\pull-from-github.ps1"
pause
