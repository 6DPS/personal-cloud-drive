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
    Write-Host "当前已关联的远程仓库地址:" -ForegroundColor Green
    Write-Host "  $remoteUrl" -ForegroundColor Cyan
    Write-Host ""
} else {
    $remoteUrl = "https://github.com/6DPS/personal-cloud-drive.git"
    git remote add origin $remoteUrl
    Write-Host "已关联远程仓库: $remoteUrl" -ForegroundColor Green
}

Write-Host "准备将代码推送到 GitHub (分支: main)..." -ForegroundColor Yellow
Write-Host "提示: 如果弹出网页或登录窗口，请点击【Sign in with your browser】或【Authorize】完成授权。" -ForegroundColor Gray
Write-Host ""

git branch -M main
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "===============================================================" -ForegroundColor Cyan
    Write-Host "         🎉 恭喜！网盘代码已成功上传到 GitHub 云端！             " -ForegroundColor Green
    Write-Host "===============================================================" -ForegroundColor Cyan
    Write-Host "现在你可以刷新你的 GitHub 网页，所有代码已经呈现！" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "[提示] 推送暂未完成。如果遇到网络波动，可以直接再次运行本脚本重试。" -ForegroundColor Yellow
}
