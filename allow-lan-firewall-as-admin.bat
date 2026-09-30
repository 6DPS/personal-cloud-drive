@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "try { Start-Process powershell.exe -Verb RunAs -ArgumentList @('-NoExit', '-ExecutionPolicy', 'Bypass', '-File', '%~dp0scripts\allow-lan-firewall.ps1') } catch { Write-Host '[提示] 已取消管理员授权。' -ForegroundColor Yellow; Start-Sleep -Seconds 3 }"
