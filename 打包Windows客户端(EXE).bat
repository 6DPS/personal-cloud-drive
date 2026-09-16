@echo off
chcp 65001 >nul
title DPSir 智云盘 - 打包Windows客户端(EXE)
cd /d "%~dp0"

echo ======================================================
echo       DPSir 智云盘 - 打包 Windows 独立绿色客户端
echo ======================================================
echo.
if not exist "node_modules\electron-builder" (
    echo [提示] 检测到尚未安装打包工具，正在自动初始化依赖...
    call npm install
)

echo 正在执行打包流程（首次打包会自动拉取 Windows 打包核心组件）...
echo 打包完成后，将在 dist 文件夹中生成免安装单文件绿色版 EXE！
echo.
call npm run electron:build
if %errorlevel% equ 0 (
    echo.
    echo ======================================================
    echo [成功] 打包完成！生成文件位于: dist 目录
    echo 您可以直接将 dist 中的 EXE 发给他人或随拷随用！
    echo ======================================================
    explorer dist
) else (
    echo.
    echo [错误] 打包过程中出现异常，请检查网络或配置。
)
pause
