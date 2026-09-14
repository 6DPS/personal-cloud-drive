@echo off
chcp 65001 >nul
title DPSir 个人网盘 - 一键推送到 GitHub
cd /d "%~dp0"

echo ===============================================================
echo          DPSir 个人网盘 - GitHub 远程仓库一键推送助手          
echo ===============================================================
echo.

REM 检查是否已有 origin
git remote get-url origin >nul 2>&1
if %errorlevel% equ 0 (
    for /f "delims=" %%u in ('git remote get-url origin') do set CURRENT_URL=%%u
    echo 当前已关联的远程仓库地址:
    echo !CURRENT_URL!
    echo.
    set /p CHOICE="是否直接推送到当前仓库？(Y/N，输入 N 可更换地址) [默认 Y]: "
    if /i "%CHOICE%"=="N" (
        goto INPUT_URL
    ) else (
        goto DO_PUSH
    )
)

:INPUT_URL
echo 请先在 GitHub 网页 ( https://github.com/new ) 创建一个空白仓库（建议选 Private 私有）。
echo 然后将仓库地址复制粘贴到下方：
echo (例如: https://github.com/你的用户名/personal-cloud-drive.git )
echo.
set /p REPO_URL="请输入 GitHub 仓库地址: "

if "%REPO_URL%"=="" (
    echo [提示] 未输入地址，操作已取消。
    pause
    exit /b 1
)

git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%
echo.
echo 成功关联远程仓库: %REPO_URL%
echo.

:DO_PUSH
echo 正在将默认分支命名为 main 并推送到 GitHub...
git branch -M main
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ===============================================================
    echo         🎉 恭喜！网盘代码已成功上传到 GitHub 云端！             
    echo ===============================================================
    echo 提示: 以后在新电脑/小主机上，只需双击【一键云端同步更新.bat】即可自动同步！
) else (
    echo.
    echo [提示] 推送遇到问题，如果是首次连接 GitHub，Windows 会弹出登录窗口，请完成授权后重试。
)

echo.
pause
