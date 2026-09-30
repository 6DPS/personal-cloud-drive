@echo off
chcp 65001 >nul
cd /d "%~dp0"
set HOST=0.0.0.0
set PORT=8081

:: 智能防火墙预检：若尚未全网络放行 8081，自动静默唤起一次放行（无感自愈）
powershell -NoProfile -ExecutionPolicy Bypass -Command "$r = Get-NetFirewallRule -Name 'DPSir-CloudDrive-LAN' -ErrorAction SilentlyContinue; if (-not $r -or $r.Profile -ne 'Any') { Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File """%~dp0scripts\allow-lan-firewall.ps1"""' -Wait }" >nul 2>&1

start "" powershell -NoProfile -Command "Start-Sleep -Seconds 1; Start-Process http://localhost:8081"
node scripts\server-watchdog.js
