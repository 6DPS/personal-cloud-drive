@echo off
chcp 65001 >nul
title DPSir 智云盘 - 桌面客户端
cd /d "%~dp0"

echo ======================================================
echo           DPSir 智云盘 - 桌面原生客户端
echo ======================================================
echo.
if not exist "node_modules\electron" (
    echo [提示] 检测到尚未安装客户端运行组件，正在自动安装所需依赖...
    call npm install
)

echo [提示] 正在启动客户端，无需开启 Edge/Chrome 浏览器...
echo [提示] 彻底解除浏览器安全警告，无上传确认弹窗！
echo.
call node node_modules\electron\cli.js electron-main.js
if %errorlevel% neq 0 (
    echo.
    echo [提示] 客户端已退出。
)
