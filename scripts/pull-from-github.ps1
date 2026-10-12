# ==============================================================================
# DPSir Personal Cloud Drive - GitHub Pull & Hot-Reload Helper
# Smart Domestic Mirror Acceleration with Fastest-Mirror Memory
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Continue"

$root = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $root

function Get-EndpointLatencyMs {
    param([string]$Url, [int]$TimeoutMs = 2000)
    try {
        $uri = [System.Uri]$Url
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        $client = [System.Net.Sockets.TcpClient]::new()
        $async = $client.BeginConnect($uri.Host, 443, $null, $null)
        if (-not $async.AsyncWaitHandle.WaitOne($TimeoutMs)) {
            $client.Close()
            return 99999
        }
        $client.EndConnect($async)
        $sw.Stop()
        $client.Close()
        return [int]$sw.ElapsedMilliseconds
    } catch {
        return 99999
    }
}

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "    DPSir Personal Cloud Drive - GitHub Cloud Sync & Update    " -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

$repoPath = "6DPS/personal-cloud-drive"
$officialRepoUrl = "https://github.com/$repoPath.git"
$defaultMirrors = @(
    "https://gh-proxy.com/https://github.com/$repoPath.git",
    "https://ghfast.top/https://github.com/$repoPath.git",
    $officialRepoUrl
)
$zipMirrors = @(
    "https://gh-proxy.com/https://github.com/$repoPath/archive/refs/heads/main.zip",
    "https://ghfast.top/https://github.com/$repoPath/archive/refs/heads/main.zip",
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

    # Auto-adapt to remembered fastest mirror or benchmark domestic mirrors by latency (ms)
    $savedFastMirror = (git config --local dpsir.fastMirror 2>$null)
    $gitMirrors = @()
    if ($savedFastMirror -and $savedFastMirror.Trim()) {
        $savedFastMirror = $savedFastMirror.Trim()
        $savedLatency = Get-EndpointLatencyMs -Url $savedFastMirror -TimeoutMs 2000
        if ($savedLatency -lt 2000) {
            $gitMirrors += $savedFastMirror
            Write-Host "[SMART-MIRROR] Locked onto remembered fastest mirror ($($savedLatency)ms): $savedFastMirror" -ForegroundColor Cyan
        }
    }
    if ($gitMirrors.Count -eq 0) {
        Write-Host "[SMART-MIRROR] Benchmarking domestic mirrors to select the fastest route..." -ForegroundColor Cyan
        $ranked = foreach ($m in $defaultMirrors) {
            $ms = Get-EndpointLatencyMs -Url $m -TimeoutMs 2000
            if ($ms -lt 2000) {
                Write-Host "  -> Speed test: $m ($($ms)ms)" -ForegroundColor Gray
                [PSCustomObject]@{ Url = $m; Ms = $ms }
            } else {
                Write-Host "  -> Speed test: $m (timeout)" -ForegroundColor DarkGray
            }
        }
        foreach ($item in ($ranked | Sort-Object Ms)) {
            $gitMirrors += $item.Url
        }
    } else {
        foreach ($m in $defaultMirrors) {
            if ($gitMirrors -notcontains $m) {
                $gitMirrors += $m
            }
        }
    }

    Write-Host "[1/3] Pulling latest updates from GitHub (via domestic mirror acceleration)..." -ForegroundColor Yellow
    git rev-parse --verify HEAD 2>$null | Out-Null
    $isFirstSync = ($LASTEXITCODE -ne 0)

    foreach ($endpoint in $gitMirrors) {
        Write-Host "  -> Connecting to endpoint: $endpoint" -ForegroundColor Gray
        if ((Get-EndpointLatencyMs -Url $endpoint -TimeoutMs 2500) -ge 2500) {
            Write-Host "  [SKIP] Endpoint unreachable, switching to next mirror..." -ForegroundColor Yellow
            continue
        }
        if ($isFirstSync) {
            Write-Host "  [INFO] First-time repository sync (~55MB including cloudflared). Downloading with live progress:" -ForegroundColor Cyan
            git -c http.sslVerify=false -c http.connectTimeout=5 -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=10 fetch --depth=1 --progress $endpoint main
        } else {
            git -c http.sslVerify=false -c http.connectTimeout=5 -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=8 fetch --progress $endpoint main
        }
        if ($LASTEXITCODE -eq 0) {
            git checkout -f -B main FETCH_HEAD
            git reset --hard FETCH_HEAD
            git update-ref refs/remotes/origin/main FETCH_HEAD 2>$null
            git branch --set-upstream-to=origin/main main 2>$null | Out-Null
            git config --local dpsir.fastMirror "$endpoint" 2>$null
            Write-Host "  [OK] Synchronized latest code & locked fastest mirror: $endpoint" -ForegroundColor Green
            $syncSuccess = $true
            break
        } else {
            Write-Host "  [WARN] Endpoint timed out or interrupted, switching to next mirror..." -ForegroundColor Yellow
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
            if ((Get-EndpointLatencyMs -Url $zipUrl -TimeoutMs 2500) -ge 2500) { continue }
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
