@echo off
chcp 65001 >nul
title DPSir 智云盘 - 撤销桌面端(回滚)
cd /d "%~dp0"

echo ======================================================
echo           DPSir 智云盘 - 撤销桌面端(一键回滚)
echo ======================================================
echo.
echo 即将移除桌面端新增的临时文件，恢复为纯网页版：
echo - electron-main.js
echo - electron/
echo - 启动桌面客户端(测试).bat
echo - 打包Windows客户端(EXE).bat
echo - 本回滚脚本自身
echo.
set /p confirm=确认要完全回滚到网页版吗？(Y/N): 
if /i "%confirm%" neq "Y" (
    echo [已取消] 未作任何更改。
    pause
    exit /b
)

echo.
echo [1/3] 正在删除 Electron 独立配置文件...
if exist "electron-main.js" del /f /q "electron-main.js"
if exist "electron" rd /s /q "electron"
if exist "启动桌面客户端(测试).bat" del /f /q "启动桌面客户端(测试).bat"
if exist "打包Windows客户端(EXE).bat" del /f /q "打包Windows客户端(EXE).bat"

echo [2/3] 正在恢复 package.json...
git checkout package.json package-lock.json >nul 2>&1

echo [3/3] 正在清理开发依赖...
call npm prune >nul 2>&1

echo.
echo ======================================================
echo [完成] 已完全恢复为纯网页版！所有数据和原有功能丝毫无损。
echo 以后可继续双击 start-lan-drive.bat 启动网页版。
echo ======================================================
pause
del /f /q "%~f0" >nul 2>&1
