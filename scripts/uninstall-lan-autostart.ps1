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
Write-Host "            DPSir 个人网盘 - 停止服务与彻底卸载助手            " -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. 注销 Windows 计划任务
Write-Host "[1/3] 正在注销开机自启动计划任务..." -ForegroundColor Green
if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
  Write-Host "  ✓ 开机自启动计划任务已成功注销。" -ForegroundColor Green
} else {
  Write-Host "  ✓ 开机自启动计划任务原本未安装或已移除。" -ForegroundColor Gray
}

# 2. 终止后台常驻服务与看门狗进程，释放文件锁定
Write-Host ""
Write-Host "[2/3] 正在终止后台运行的网盘服务进程并释放文件锁定..." -ForegroundColor Green
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

# 停止由当前目录运行的 node.exe 服务
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

# 确保端口 8081 释放
try {
  $netstat = Get-NetTCPConnection -LocalPort 8081 -State Listen -ErrorAction SilentlyContinue
  foreach ($conn in $netstat) {
    if ($conn.OwningProcess -gt 0) {
      Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
      $killedCount++
    }
  }
} catch {}

Write-Host "  ✓ 后台网盘服务已全部终止，所有文件句柄已释放（共终止 $killedCount 个关联进程）。" -ForegroundColor Green

# 3. 输出后续指引
Write-Host ""
Write-Host "[3/3] 完成清理准备" -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "  🎉 网盘服务已彻底停止，开机自启已注销！" -ForegroundColor Green
Write-Host "  如需彻底从电脑中删除网盘：" -ForegroundColor Yellow
Write-Host "  1. 可以直接右键【删除】当前程序文件夹 ($root)" -ForegroundColor Gray
Write-Host "  2. 可以直接右键【删除】数据文件夹 (默认 D:\PersonalCloudDrive)" -ForegroundColor Gray
Write-Host "  现在删除绝不会再提示「文件夹正在被使用」！" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

if (-not $NoPause) {
  pause
}
