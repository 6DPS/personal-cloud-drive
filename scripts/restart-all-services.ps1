# ==============================================================================
# DPSir Personal Cloud Drive - Full Service Restart & Auto-Repair Helper
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Continue"

$root = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $root

$envPath = Join-Path $root ".env"
if (Test-Path -LiteralPath $envPath) {
    Get-Content -LiteralPath $envPath | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line -match "^([^=]+)=(.*)$") {
            $k = $matches[1].Trim()
            $v = $matches[2].Trim().Trim('"').Trim("'")
            [Environment]::SetEnvironmentVariable($k, $v)
        }
    }
}

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "   DPSir Personal Cloud Drive - Restart & Auto-Repair Helper   " -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] Stopping existing background processes..." -ForegroundColor Yellow
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Stop-Process -Name cloudflared -Force -ErrorAction SilentlyContinue
Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.ProcessId -ne $PID -and ($_.CommandLine -like "*run-cloudflare-domain-hidden.ps1*" -or $_.CommandLine -like "*run-lan-drive-hidden.ps1*") } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 1
Write-Host "  [OK] Old background processes terminated safely." -ForegroundColor Green

# Auto-heal: verify firewall rule covers all network profiles (Profile: Any)
$fw = Get-NetFirewallRule -Name "DPSir-CloudDrive-LAN" -ErrorAction SilentlyContinue
if (-not $fw -or $fw.Profile -ne "Any") {
    $allowScript = Join-Path $PSScriptRoot "allow-lan-firewall.ps1"
    if (Test-Path -LiteralPath $allowScript) {
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $allowScript -NoPause
    }
}

Write-Host ""
Write-Host "[2/3] Starting cloud drive core service and Cloudflare tunnel..." -ForegroundColor Yellow

$lanTask = Get-ScheduledTask -TaskName "DPSir Personal Cloud Drive LAN" -ErrorAction SilentlyContinue
if ($lanTask) {
    Start-ScheduledTask -TaskName "DPSir Personal Cloud Drive LAN" -ErrorAction SilentlyContinue
} else {
    $lanVbs = Join-Path $PSScriptRoot "run-lan-drive-silent.vbs"
    if (Test-Path -LiteralPath $lanVbs) {
        Start-Process "wscript.exe" -ArgumentList "`"$lanVbs`"" -WorkingDirectory $root
    }
}

$cfConfig = Join-Path $root ".cloudflared\config.yml"
$cfTask = Get-ScheduledTask -TaskName "DPSir Personal Cloud Drive Cloudflare Tunnel" -ErrorAction SilentlyContinue
if (Test-Path -LiteralPath $cfConfig) {
    if ($cfTask) {
        Start-ScheduledTask -TaskName "DPSir Personal Cloud Drive Cloudflare Tunnel" -ErrorAction SilentlyContinue
    } else {
        $cfVbs = Join-Path $PSScriptRoot "run-cloudflare-domain-silent.vbs"
        if (Test-Path -LiteralPath $cfVbs) {
            Start-Process "wscript.exe" -ArgumentList "`"$cfVbs`"" -WorkingDirectory $root
        }
    }
} else {
    Write-Host "  [INFO] No Cloudflare tunnel config (.cloudflared\config.yml) on this host. Running in LAN mode." -ForegroundColor Cyan
}

Write-Host "  [OK] Startup commands issued. Verifying service readiness..." -ForegroundColor Green

Write-Host ""
Write-Host "[3/3] Running health checks on local and public endpoints..." -ForegroundColor Yellow

$localOk = $false
for ($i = 0; $i -lt 8; $i++) {
    try {
        $resp1 = Invoke-WebRequest -Uri "http://127.0.0.1:8081/api/me" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($resp1.StatusCode -eq 200) { $localOk = $true; break }
    } catch {}
    Start-Sleep -Milliseconds 800
}

$publicOk = $false
$publicTarget = if ($env:PUBLIC_ACCESS_URL) { $env:PUBLIC_ACCESS_URL.Trim() } else { "" }
if ($publicTarget -and $publicTarget -ne "https://pan.yourdomain.com") {
    Write-Host -NoNewline "  Checking public tunnel ($publicTarget)" -ForegroundColor Cyan
    for ($i = 0; $i -lt 8; $i++) {
        try {
            $resp2 = Invoke-WebRequest -Uri "$publicTarget/api/me" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
            if ($resp2.StatusCode -eq 200) {
                $publicOk = $true
                break
            }
        } catch {}
        Write-Host -NoNewline "." -ForegroundColor Yellow
        Start-Sleep -Seconds 1
    }
    Write-Host ""
}

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
if ($localOk -and $publicOk) {
    Write-Host "   [OK] All cloud drive services restarted and 100% online!    " -ForegroundColor Green
} elseif ($localOk -and -not $publicTarget) {
    Write-Host "   [OK] Local LAN cloud drive service is 100% online!          " -ForegroundColor Green
} elseif ($localOk) {
    Write-Host "   [OK] Local service is online; public tunnel is connecting..." -ForegroundColor Yellow
} else {
    Write-Host "   [INFO] Services are starting in the background. Please refresh browser shortly." -ForegroundColor Yellow
}
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""
$domainStr = if ($publicTarget) { $publicTarget } else { "Not configured (LAN mode)" }
$localStatus = if ($localOk) { "ONLINE [OK]" } else { "STARTING..." }
$publicStatus = if ($publicOk) { "ONLINE [OK]" } elseif ($publicTarget) { "CONNECTING..." } else { "DISABLED" }
Write-Host "  1. Local LAN URL : http://127.0.0.1:8081  --> $localStatus" -ForegroundColor $(if ($localOk) { "Green" } else { "Yellow" })
Write-Host "  2. Public Domain : $domainStr  --> $publicStatus" -ForegroundColor $(if ($publicOk) { "Green" } elseif ($publicTarget) { "Yellow" } else { "Gray" })
Write-Host ""
Write-Host "You can now return to your browser and press [F5] to refresh." -ForegroundColor Cyan
Write-Host ""
