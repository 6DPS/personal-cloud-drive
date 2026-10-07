@echo off
cd /d "%~dp0"
echo [1/3] Git Pulling...
git pull
echo.
echo [2/3] Checking dependencies...
call npm install --omit=dev
echo.
echo [3/3] Restarting services...
powershell.exe -ExecutionPolicy Bypass -File "%~dp0scripts\restart-all-services.ps1"
echo.
echo All Done! Please refresh your browser.
pause
