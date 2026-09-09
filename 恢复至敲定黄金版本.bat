@echo off
chcp 65001 >nul
title 恢复网盘至敲定黄金稳定版本

echo =======================================================
echo          DPSir 智云盘 - 一键恢复黄金基准版本
echo =======================================================
echo.

set "SCRIPT_DIR=%~dp0"
set "BACKUP_DIR=%SCRIPT_DIR%backup_golden_stable_20260909"

if not exist "%BACKUP_DIR%" (
    echo [错误] 未找到黄金备份目录: "%BACKUP_DIR%"
    echo 请确认备份文件夹是否存在。
    echo.
    pause
    exit /b 1
)

echo 正在从黄金备份目录恢复前端页面与样式 (public)...
xcopy "%BACKUP_DIR%\public" "%SCRIPT_DIR%public" /E /I /Y /Q >nul

echo 正在从黄金备份目录恢复核心服务逻辑 (server.js)...
copy /Y "%BACKUP_DIR%\server.js" "%SCRIPT_DIR%server.js" >nul

echo 正在从黄金备份目录恢复依赖配置 (package.json)...
copy /Y "%BACKUP_DIR%\package.json" "%SCRIPT_DIR%package.json" >nul

echo.
echo =======================================================
echo  [成功] 已经 100%% 完整恢复至敲定的黄金稳定版本！
echo  包含所有核心功能与最稳定的原版 UI 界面。
echo  如果在浏览器中浏览，请按 Ctrl + F5 强制刷新即可！
echo =======================================================
echo.
pause
