@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\clean-hidden-drive-files.ps1"
pause
