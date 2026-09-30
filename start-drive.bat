@echo off
chcp 65001 >nul
cd /d "%~dp0"
set HOST=0.0.0.0
set PORT=8081

start "" powershell -NoProfile -Command "Start-Sleep -Seconds 1; Start-Process http://localhost:8081"
node scripts\server-watchdog.js
pause
