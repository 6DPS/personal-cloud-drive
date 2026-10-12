# ==============================================================================
# DPSir Personal Cloud Drive - GitHub Pull & Hot-Reload Helper
# Built-in Domestic Mirror Acceleration (No VPN / Foreign Network Required)
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

$repoPath = "6DPS/personal-cloud-drive"
$officialRepoUrl = "https://github.com/$repoPath.git"
$gitMirrors = @(
    "https://ghfast.top/https://github.com/$repoPath.git",
    "https://gh-proxy.com/https://github.com/$repoPath.git",
    $officialRepoUrl
)
$zipMirrors = @(
    "https://ghfast.top/https://github.com/$repoPath/archive/refs/heads/main.zip",
    "https://gh-proxy.com/https://github.com/$repoPath/archive/refs/heads/main.zip",
    "https://codeload.github.com/$repoPath/zip/refs/heads/main"
)

$syncSuccess = $false
$hasGit = [bool](Get-Command git -ErrorAction SilentlyContinue)
$hasGitDir = Test-Path -LiteralPath (Join-Path $root ".git")

if ($hasGit) {
    if (-not $hasGitDir) {
        Write-Host "[AUTO-INIT] Initializing local Git repository..." -ForegroundColor Cyan
        git init | Out-Null
    }

    $currentRemote = git remote get-url origin 2>$null
    if (-not $currentRemote) {
        git remote add origin $officialRepoUrl 2>$null
    }

    Write-Host "[1/3] Pulling latest updates from GitHub (via domestic mirror acceleration)..." -ForegroundColor Yellow
    git rev-parse --verify HEAD 2>$null | Out-Null
    $isFirstSync = ($LASTEXITCODE -ne 0)
    foreach ($endpoint in $gitMirrors) {
        Write-Host "  -> Trying endpoint: $endpoint" -ForegroundColor Gray
        if ($isFirstSync) {
            Write-Host "  [INFO] First-time repository sync (~55MB including cloudflared). Downloading with live progress:" -ForegroundColor Cyan
            git -c http.sslVerify=false -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=20 fetch --depth=1 --progress $endpoint main
        } else {
            git -c http.sslVerify=false -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=15 fetch --progress $endpoint main
        }
        if ($LASTEXITCODE -eq 0) {
            git checkout -f -B main FETCH_HEAD
            git reset --hard FETCH_HEAD
            git update-ref refs/remotes/origin/main FETCH_HEAD 2>$null
            git branch --set-upstream-to=origin/main main 2>$null | Out-Null
            Write-Host "  [OK] Synchronized latest code from: $endpoint" -ForegroundColor Green
            $syncSuccess = $true
            break
        } else {
            Write-Host "  [WARN] Endpoint timed out or unreachable, switching to next mirror..." -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "[INFO] Git CLI not detected. Using direct HTTP archive sync via domestic mirror..." -ForegroundColor Cyan
}

if (-not $syncSuccess) {
    Write-Host "[FALLBACK] Downloading latest release archive via HTTP mirror (No Git/VPN required)..." -ForegroundColor Yellow
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $tmpZip = Join-Path $env:TEMP "dpsir-cloud-drive-main.zip"
    $tmpExtract = Join-Path $env:TEMP "dpsir-cloud-drive-extract"

    foreach ($zipUrl in $zipMirrors) {
        try {
            Write-Host "  -> Downloading archive: $zipUrl" -ForegroundColor Gray
            if (Test-Path -LiteralPath $tmpZip) { Remove-Item -LiteralPath $tmpZip -Force -ErrorAction SilentlyContinue }
            Invoke-WebRequest -Uri $zipUrl -OutFile $tmpZip -TimeoutSec 30 -UseBasicParsing
            if ((Test-Path -LiteralPath $tmpZip) -and (Get-Item -LiteralPath $tmpZip).Length -gt 50KB) {
                if (Test-Path -LiteralPath $tmpExtract) { Remove-Item -LiteralPath $tmpExtract -Recurse -Force -ErrorAction SilentlyContinue }
                Expand-Archive -LiteralPath $tmpZip -DestinationPath $tmpExtract -Force
                $extractedSubDir = Get-ChildItem -LiteralPath $tmpExtract -Directory | Select-Object -First 1
                if ($extractedSubDir) {
                    Get-ChildItem -LiteralPath $extractedSubDir.FullName -Force | ForEach-Object {
                        if ($_.Name -ne ".env" -and $_.Name -ne ".git") {
                            Copy-Item -LiteralPath $_.FullName -Destination $root -Recurse -Force
                        }
                    }
                    Write-Host "  [OK] Archive extracted and updated successfully!" -ForegroundColor Green
                    $syncSuccess = $true
                }
                Remove-Item -LiteralPath $tmpZip -Force -ErrorAction SilentlyContinue
                Remove-Item -LiteralPath $tmpExtract -Recurse -Force -ErrorAction SilentlyContinue
                if ($syncSuccess) { break }
            }
        } catch {
            Write-Host "  [WARN] Archive mirror failed, trying next mirror..." -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "[2/3] Verifying dependencies via domestic mirror (registry.npmmirror.com)..." -ForegroundColor Yellow
& npm config set registry https://registry.npmmirror.com 2>$null
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
