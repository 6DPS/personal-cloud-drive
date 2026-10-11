# ==============================================================================
# DPSir Personal Cloud Drive - GitHub Push Helper
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Continue"

$root = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $root

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "      DPSir Personal Cloud Drive - GitHub Push Helper          " -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

$remoteUrl = git remote get-url origin 2>$null
if ($remoteUrl) {
    Write-Host "Connected remote repository: $remoteUrl" -ForegroundColor Green
    Write-Host ""
} else {
    $remoteUrl = "https://github.com/6DPS/personal-cloud-drive.git"
    git remote add origin $remoteUrl
    Write-Host "Added remote repository: $remoteUrl" -ForegroundColor Green
}

$changes = git status --porcelain
if ($changes) {
    Write-Host "[1/2] Local code changes detected. Preparing commit..." -ForegroundColor Yellow
    $nowStr = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[TIP] Your commit message will be shown in the GitHub repository history." -ForegroundColor Cyan
    $customMsg = Read-Host "Enter commit description [Press Enter for default: update: $nowStr code update]"
    if (-not $customMsg.Trim()) {
        $customMsg = "update: $nowStr code update"
    }
    git add .
    git commit -m "$customMsg"
    Write-Host "  [OK] Committed local changes: $customMsg" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[1/2] Working tree is clean. No new local changes to commit." -ForegroundColor Green
    Write-Host ""
}

Write-Host "[2/2] Pushing commits to GitHub remote (main branch)..." -ForegroundColor Yellow
git branch -M main
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "===============================================================" -ForegroundColor Cyan
    Write-Host "    [OK] Code pushed to GitHub remote repository successfully! " -ForegroundColor Green
    Write-Host "===============================================================" -ForegroundColor Cyan
    Write-Host "You can refresh your GitHub page to view the latest updates." -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "[WARN] Push encountered a network issue. Please re-run this script later to retry." -ForegroundColor Yellow
    Write-Host ""
}
