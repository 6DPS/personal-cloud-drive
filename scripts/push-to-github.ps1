# ==============================================================================
# DPSir 个人网盘 - GitHub 推送向导
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Continue"

$root = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $root

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "          DPSir 个人网盘 - GitHub 远程仓库一键推送助手          " -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

$remoteUrl = git remote get-url origin 2>$null
if ($remoteUrl) {
    Write-Host "当前已关联的远程仓库: $remoteUrl" -ForegroundColor Green
    Write-Host ""
} else {
    $remoteUrl = "https://github.com/6DPS/personal-cloud-drive.git"
    git remote add origin $remoteUrl
    Write-Host "已关联远程仓库: $remoteUrl" -ForegroundColor Green
}

$changes = git status --porcelain
if ($changes) {
    Write-Host "[1/2] 检测到本地代码有改动，正在自动打包提交..." -ForegroundColor Yellow
    git add .
    $nowStr = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    git commit -m "update: $nowStr 代码更新迭代"
    Write-Host "  ✓ 本地更新已记录" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[1/2] 本地代码处于最新提交状态，无需重复打包。" -ForegroundColor Green
    Write-Host ""
}

Write-Host "[2/2] 正在将代码推送到 GitHub 云端 (main 分支)..." -ForegroundColor Yellow
git branch -M main
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "===============================================================" -ForegroundColor Cyan
    Write-Host "         🎉 恭喜！网盘代码已成功上传到 GitHub 云端！             " -ForegroundColor Green
    Write-Host "===============================================================" -ForegroundColor Cyan
    Write-Host "你可以刷新你的 GitHub 网页，最新代码已经同步更新！" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "[提示] 推送遇到网络波动，可稍后直接再次运行本脚本重试。" -ForegroundColor Yellow
    Write-Host ""
}
