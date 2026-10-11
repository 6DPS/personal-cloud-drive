$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
. (Join-Path $PSScriptRoot "cloudflared-common.ps1")

$cloudflared = Get-Cloudflared -Root $root
$configPath = Join-Path $root ".cloudflared\config.yml"

if (-not (Test-Path -LiteralPath $configPath)) {
  Write-Host "Fixed domain tunnel is not configured yet. Run setup-cloudflare-domain.bat first."
  Read-Host "Press Enter to exit..."
  exit 1
}

$localCred = Join-Path $root ".cloudflared\9a130b3a-6849-447e-b800-ed830e19e83a.json"
if (Test-Path -LiteralPath $localCred) {
  $cfgText = Get-Content -LiteralPath $configPath -Raw
  $updated = $cfgText -replace "credentials-file:.*", "credentials-file: $localCred"
  Set-Content -LiteralPath $configPath -Value $updated -Encoding UTF8
}

# Check if tunnel is already running and healthy in background
$existing = Get-CimInstance Win32_Process -Filter "Name = 'cloudflared.exe'" |
  Where-Object { $_.CommandLine -like "*$configPath*" } |
  Select-Object -First 1

if ($existing) {
  $isReady = $false
  try {
    $resp = Invoke-WebRequest -Uri "http://127.0.0.1:20241/ready" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 400) { $isReady = $true }
  } catch {}

  if ($isReady) {
    Write-Host ""
    Write-Host "======================================================"
    Write-Host "  [INFO] Cloudflare fixed-domain tunnel is already running in background!"
    Write-Host "  Public Access URL : $(if ($env:PUBLIC_ACCESS_URL) { $env:PUBLIC_ACCESS_URL } else { "https://your-domain.com" })"
    Write-Host "  Background PID    : $($existing.ProcessId) (Health Status: OK 200)"
    Write-Host "  No need to start a duplicate instance."
    Write-Host "======================================================"
    Write-Host ""
    Read-Host "Press Enter to exit..."
    exit 0
  }
}

# Clean up any orphan or unhealthy cloudflared process before starting
Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Ensure-Drive-Running -Root $root

Write-Host ""
Write-Host "======================================================"
Write-Host "  Starting Cloudflare fixed-domain tunnel..."
Write-Host "  Public Access URL : $(if ($env:PUBLIC_ACCESS_URL) { $env:PUBLIC_ACCESS_URL } else { "https://your-domain.com" })"
Write-Host "  Keep this window open; closing it will stop public tunnel access."
Write-Host "======================================================"
Write-Host ""

& $cloudflared tunnel --config $configPath run
