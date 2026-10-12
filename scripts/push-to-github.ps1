# ==============================================================================
# DPSir Personal Cloud Drive - GitHub Push Helper
# Built-in Domestic Mirror & Unborn Branch Auto-Repair
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

$repoPath = "6DPS/personal-cloud-drive"
$officialRepoUrl = "https://github.com/$repoPath.git"
$gitMirrors = @(
    "https://ghfast.top/https://github.com/$repoPath.git",
    "https://gh-proxy.com/https://github.com/$repoPath.git",
    $officialRepoUrl
)

if (-not (Test-Path -LiteralPath (Join-Path $root ".git"))) {
    git init | Out-Null
}

$remoteUrl = git remote get-url origin 2>$null
if ($remoteUrl) {
    Write-Host "Connected remote repository: $remoteUrl" -ForegroundColor Green
    Write-Host ""
} else {
    $remoteUrl = $officialRepoUrl
    git remote add origin $remoteUrl
    Write-Host "Added remote repository: $remoteUrl" -ForegroundColor Green
    Write-Host ""
}

# Repair unborn HEAD if repository was initialized without commits
git rev-parse --verify HEAD 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[AUTO-REPAIR] Synchronizing commit history from GitHub mirror..." -ForegroundColor Cyan
    foreach ($endpoint in $gitMirrors) {
        git -c http.sslVerify=false -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=15 fetch $endpoint main 2>$null
        if ($LASTEXITCODE -eq 0) {
            git checkout -B main FETCH_HEAD 2>$null | Out-Null
            git reset --mixed FETCH_HEAD 2>$null | Out-Null
            git update-ref refs/remotes/origin/main FETCH_HEAD 2>$null
            break
        }
    }
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

$curBranch = git branch --show-current 2>$null
if ($curBranch -and ($curBranch -ne "main")) {
    git branch -M main 2>$null
}

Write-Host "[2/2] Checking & pushing commits to GitHub remote (main branch)..." -ForegroundColor Yellow

$localHead = (git rev-parse HEAD 2>$null)
$remoteHead = ""
foreach ($endpoint in $gitMirrors) {
    $lsOut = git -c http.sslVerify=false -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=10 ls-remote $endpoint refs/heads/main 2>$null
    if ($LASTEXITCODE -eq 0 -and $lsOut -match "^([0-9a-f]{40})") {
        $remoteHead = $matches[1]
        break
    }
}

$pushSuccess = $false
if ($localHead -and $remoteHead -and ($localHead.Trim() -eq $remoteHead.Trim())) {
    Write-Host "  [OK] Local repository is already 100% in sync with GitHub remote (commit $($localHead.Substring(0,7)))." -ForegroundColor Green
    $pushSuccess = $true
} else {
    $pushEndpoints = @(
        $officialRepoUrl,
        "https://ghfast.top/https://github.com/$repoPath.git",
        "https://gh-proxy.com/https://github.com/$repoPath.git"
    )
    foreach ($endpoint in $pushEndpoints) {
        Write-Host "  -> Pushing to: $endpoint" -ForegroundColor Gray
        git -c http.sslVerify=false -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=15 push $endpoint main
        if ($LASTEXITCODE -eq 0) {
            git update-ref refs/remotes/origin/main HEAD 2>$null
            $pushSuccess = $true
            break
        }
    }
}

if ($pushSuccess) {
    Write-Host ""
    Write-Host "===============================================================" -ForegroundColor Cyan
    Write-Host "    [OK] Code synchronized with GitHub repository successfully!" -ForegroundColor Green
    Write-Host "===============================================================" -ForegroundColor Cyan
    Write-Host "You can refresh your GitHub page to view the latest updates." -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "[WARN] Push encountered a network issue. Please re-run this script later to retry." -ForegroundColor Yellow
    Write-Host ""
}
