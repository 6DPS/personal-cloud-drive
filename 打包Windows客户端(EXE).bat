@echo off
chcp 65001 >nul
title DPSir 智云盘 - 打包Windows客户端(Setup.exe)
cd /d "%~dp0"

echo ======================================================
echo       DPSir 智云盘 - 打包 Windows 官方标准安装包
echo ======================================================
echo.
if not exist "node_modules\electron-builder" (
    echo [提示] 检测到尚未安装打包工具，正在自动初始化依赖...
    call npm install
)

echo 正在执行打包流程（构建商业级 NSIS 标准安装向导）...
echo 打包完成后，将在 dist 文件夹中生成【DPSir 智云盘 Setup.exe】！
echo.
call npm run electron:build
if %errorlevel% equ 0 (
    echo.
    echo ======================================================
    echo [成功] 打包完成！生成文件位于: dist 目录
    echo 产物文件: 【DPSir 智云盘 Setup.exe】
    echo (自带安装向导、支持自选安装盘符、自动创建桌面与开始菜单图标、完美固定任务栏)
    echo ======================================================
    explorer dist
) else (
    echo.
    echo [错误] 打包过程中出现异常，请检查网络或配置。
)
pause
