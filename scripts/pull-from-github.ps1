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

if ($hasGit -and $hasGitDir) {
    Write-Host "[1/3] 正在从 GitHub 云端拉取最新代码更新 (git pull)..." -ForegroundColor Yellow
    git pull
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "[错误] 拉取代码遇到异常，请检查网络或 GitHub 连接。" -ForegroundColor Red
        Write-Host ""
        exit 1
    }
} else {
    Write-Host "[提示] 检测到当前电脑未安装 Git 命令行工具，或当前目录为 ZIP 解压版(无.git版本库)。" -ForegroundColor Yellow
    Write-Host "       因此无法直接执行 'git pull' 命令行更新。" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "【快速更新建议】：只需在 GitHub 网页重新下载最新 ZIP 或复制更新后的核心文件(server.js 与 public/app.js)，" -ForegroundColor Cyan
    Write-Host "直接覆盖到本目录，然后双击运行【一键重启与修复服务(Windows).bat】即可平滑更新！" -ForegroundColor Cyan
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
