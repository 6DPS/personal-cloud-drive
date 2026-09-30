@echo off
chcp 65001 >nul
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -ExecutionPolicy Bypass -Command ""& ''%~dp0scripts\allow-lan-firewall.ps1''; Write-Host ''`n按任意键退出...''; [Console]::ReadKey() > $null""'"
