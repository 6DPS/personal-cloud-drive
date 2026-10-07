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

$hasGit = [bool](Get-Command git -ErrorAction SilentlyContinue)
$hasGitDir = Test-Path -LiteralPath (Join-Path $root ".git")

if ($hasGit) {
    if (-not $hasGitDir) {
        Write-Host "[自动建档] 检测到系统已安装 Git，正在自动将当前目录绑定至 GitHub 云端仓库..." -ForegroundColor Cyan
        git init
        git remote add origin https://github.com/6DPS/personal-cloud-drive.git
        git fetch origin
        git reset --hard origin/main
        git branch -M main
        git branch --set-upstream-to=origin/main main
        Write-Host "[成功] 已全自动完成云端关联！" -ForegroundColor Green
    } else {
        Write-Host "[1/3] 正在从 GitHub 云端拉取最新代码更新 (git pull)..." -ForegroundColor Yellow
        git pull
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[警告] 常规拉取遇到异常，正在尝试强制对齐云端最新代码..." -ForegroundColor Yellow
            git fetch origin
            git reset --hard origin/main
        }
    }
} else {
    Write-Host "[提示] 检测到当前电脑未安装 Git 命令行工具。" -ForegroundColor Yellow
    Write-Host "       安装 Git (https://git-scm.com/download/win) 后即可永久支持双击一键自动同步！" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host ""
Write-Host "[2/3] 正在检查依赖完整性 (npm install --omit=dev)..." -ForegroundColor Yellow
npm install --omit=dev

Write-Host ""
Write-Host "[3/3] 正在平滑重启网盘服务与公网隧道..." -ForegroundColor Yellow
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
