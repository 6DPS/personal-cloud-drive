# ==============================================================================
# DPSir 个人网盘 - GitHub 云端拉取与热更新向导
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Continue"

$root = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $root

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "        DPSir 个人网盘 - GitHub 云端同步与热更新助手            " -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] 正在从 GitHub 云端拉取最新代码更新 (git pull)..." -ForegroundColor Yellow
git pull
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[错误] 拉取代码遇到异常，请检查网络或 GitHub 连接。" -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "[2/3] 正在检查依赖完整性 (npm install --omit=dev)..." -ForegroundColor Yellow
npm install --omit=dev

Write-Host ""
Write-Host "[3/3] 正在平滑重启网盘守护服务..." -ForegroundColor Yellow
Stop-Process -Name node -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
Start-ScheduledTask -TaskName "DPSir Personal Cloud Drive LAN" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "       🎉 恭喜！网盘已成功同步至 GitHub 最新版本并已完成重启！    " -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""
