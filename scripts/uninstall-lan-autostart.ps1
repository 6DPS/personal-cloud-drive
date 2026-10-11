param(
  [switch]$NoPause
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Continue"

$root = Split-Path -Parent $PSScriptRoot
$taskName = "DPSir Personal Cloud Drive LAN"

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "     DPSir Personal Cloud Drive - Stop & Uninstall Helper      " -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Unregister Windows Scheduled Task
Write-Host "[1/3] Removing Windows startup scheduled task..." -ForegroundColor Green
if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
  Write-Host "  [OK] Startup scheduled task removed successfully." -ForegroundColor Green
} else {
  Write-Host "  [OK] Startup scheduled task was not installed or already removed." -ForegroundColor Gray
}

# 2. Stop background cloud drive and watchdog processes, releasing file locks
Write-Host ""
Write-Host "[2/3] Stopping background cloud drive processes and releasing file locks..." -ForegroundColor Green
$logDir = Join-Path $root "logs"
$lockFile = Join-Path $logDir "server-watchdog.pid"
if (Test-Path -LiteralPath $lockFile) {
  try {
    $pidToKill = [int](Get-Content -LiteralPath $lockFile -Raw).Trim()
    if ($pidToKill -gt 0) {
      Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
    }
  } catch {}
  Remove-Item -LiteralPath $lockFile -Force -ErrorAction SilentlyContinue
}

# Stop node.exe processes started from this directory
$killedCount = 0
$nodeProcesses = Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object {
  $_.Name -eq "node.exe" -and (
    $_.CommandLine -like "*$root*" -or
    $_.CommandLine -like "*server-watchdog.js*" -or
    $_.CommandLine -like "*server.js*"
  )
}
foreach ($p in $nodeProcesses) {
  try {
    Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
    $killedCount++
  } catch {}
}

# Ensure port 8081 is released
try {
  $netstat = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue
  foreach ($conn in $netstat) {
    if ($conn.OwningProcess -gt 0) {
      Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
      $killedCount++
    }
  }
} catch {}

Write-Host "  [OK] All background services stopped and file handles released ($killedCount process(es) terminated)." -ForegroundColor Green

# 3. Output next steps
Write-Host ""
Write-Host "[3/3] Cleanup Complete" -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "  [OK] Cloud drive service stopped and auto-start removed!" -ForegroundColor Green
Write-Host "  If you want to completely delete the cloud drive from this PC:" -ForegroundColor Yellow
Write-Host "  1. You can now delete the application folder ($root)" -ForegroundColor Gray
Write-Host "  2. You can delete the data folder if desired (default: D:\PersonalCloudDrive)" -ForegroundColor Gray
Write-Host "  All file locks have been released." -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

if (-not $NoPause) {
  Read-Host "Press Enter to exit..."
}
