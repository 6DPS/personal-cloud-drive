# ==============================================================================
# DPSir Personal Cloud Drive - GitHub Pull & Hot-Reload Helper
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Continue"

$root = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $root

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "    DPSir Personal Cloud Drive - GitHub Cloud Sync & Update    " -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

$hasGit = [bool](Get-Command git -ErrorAction SilentlyContinue)
$hasGitDir = Test-Path -LiteralPath (Join-Path $root ".git")

if ($hasGit) {
    if (-not $hasGitDir) {
        Write-Host "[AUTO-INIT] Git detected. Automatically binding current folder to GitHub repository..." -ForegroundColor Cyan
        git init
        git remote add origin https://github.com/6DPS/personal-cloud-drive.git
        git fetch origin
        git reset --hard origin/main
        git branch -M main
        git branch --set-upstream-to=origin/main main
        Write-Host "[OK] Repository bound to GitHub remote successfully!" -ForegroundColor Green
    } else {
        Write-Host "[1/3] Pulling latest updates from GitHub (git pull)..." -ForegroundColor Yellow
        git pull
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[WARN] Standard git pull encountered an issue. Resetting to origin/main..." -ForegroundColor Yellow
            git fetch origin
            git reset --hard origin/main
        }
    }
} else {
    Write-Host "[WARN] Git CLI is not installed on this computer." -ForegroundColor Yellow
    Write-Host "       Install Git (https://git-scm.com/download/win) to enable one-click GitHub sync." -ForegroundColor Cyan
    Write-Host ""
}

Write-Host ""
Write-Host "[2/3] Verifying dependencies (npm install --omit=dev)..." -ForegroundColor Yellow
npm install --omit=dev

Write-Host ""
Write-Host "[3/3] Restarting cloud drive service and tunnel..." -ForegroundColor Yellow
$restartScript = Join-Path $PSScriptRoot "restart-all-services.ps1"
if (Test-Path -LiteralPath $restartScript) {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $restartScript
} else {
    Stop-Process -Name node -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    $lanTask = Get-ScheduledTask -TaskName "DPSir Personal Cloud Drive LAN" -ErrorAction SilentlyContinue
    if ($lanTask) {
        Start-ScheduledTask -TaskName "DPSir Personal Cloud Drive LAN" -ErrorAction SilentlyContinue
    } else {
        $lanVbs = Join-Path $PSScriptRoot "run-lan-drive-silent.vbs"
        if (Test-Path -LiteralPath $lanVbs) {
            Start-Process "wscript.exe" -ArgumentList "`"$lanVbs`"" -WorkingDirectory $root
        }
    }
}
