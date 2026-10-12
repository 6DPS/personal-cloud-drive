# ==============================================================================
# DPSir Personal Cloud Drive - One-Click Cloudflare Public Domain Setup Wizard
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Continue"

$root = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $root
. (Join-Path $PSScriptRoot "cloudflared-common.ps1")

$cloudflared = Get-Cloudflared -Root $root
$configDir = Join-Path $root ".cloudflared"
$configPath = Join-Path $configDir "config.yml"
$hostnamePath = Join-Path $configDir "hostname.txt"

New-Item -ItemType Directory -Force -Path $configDir | Out-Null

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "   DPSir Personal Cloud Drive - Public Domain Setup Wizard     " -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Prerequisites:" -ForegroundColor Green
Write-Host "  1. You have a domain hosted on Cloudflare." -ForegroundColor Gray
Write-Host "  2. A browser window will open to authorize your domain." -ForegroundColor Gray
Write-Host ""

$hostname = (Read-Host "Step 1: Enter the full domain you want to use (e.g. pan.yourdomain.com)").Trim()
$hostname = $hostname -replace "^https?://", "" -replace "/.*$", ""
if (-not $hostname -or $hostname -notmatch "\.") {
  Write-Host "[ERROR] Invalid domain format." -ForegroundColor Red
  Read-Host "Press Enter to exit..."
  exit 1
}

$safeSuffix = ($hostname -replace "[^a-zA-Z0-9-]", "-").ToLower()
$tunnelName = "dpsir-drive-$safeSuffix"

Write-Host ""
Write-Host "Step 2: Opening browser for Cloudflare authorization..." -ForegroundColor Yellow
Write-Host "        Please select your domain in the browser and click [Authorize]." -ForegroundColor Cyan
& $cloudflared tunnel login

Write-Host ""
Write-Host "Step 3: Creating dedicated encrypted tunnel ($tunnelName)..." -ForegroundColor Yellow
& $cloudflared tunnel create $tunnelName 2>$null

$infoRaw = & $cloudflared tunnel info $tunnelName --output json 2>$null
$tunnelId = ""
try {
  $json = $infoRaw | ConvertFrom-Json
  $tunnelId = $json.id
} catch {}

if (-not $tunnelId) {
  $listRaw = & $cloudflared tunnel list --output json 2>$null
  try {
    $listJson = $listRaw | ConvertFrom-Json
    $matched = $listJson | Where-Object { $_.name -eq $tunnelName } | Select-Object -First 1
    if ($matched) { $tunnelId = $matched.id }
  } catch {}
}

if (-not $tunnelId) {
  Write-Host "[ERROR] Could not obtain Tunnel ID. Please verify Cloudflare authorization succeeded." -ForegroundColor Red
  Read-Host "Press Enter to exit..."
  exit 1
}

$credentials = Join-Path $env:USERPROFILE ".cloudflared\$tunnelId.json"

@"
tunnel: $tunnelId
credentials-file: $credentials

ingress:
  - hostname: $hostname
    service: http://127.0.0.1:8081
  - service: http_status:404
"@ | Set-Content -LiteralPath $configPath -Encoding UTF8
Set-Content -LiteralPath $hostnamePath -Value $hostname -Encoding UTF8

# Automatically write PUBLIC_ACCESS_URL into .env
$envFile = Join-Path $root ".env"
if (Test-Path -LiteralPath $envFile) {
  $envRaw = Get-Content -LiteralPath $envFile -Raw -Encoding UTF8
  if ($envRaw -match "(?m)^\s*#?\s*PUBLIC_ACCESS_URL\s*=.*$") {
    $envRaw = $envRaw -replace "(?m)^\s*#?\s*PUBLIC_ACCESS_URL\s*=.*$", "PUBLIC_ACCESS_URL=https://$hostname"
  } else {
    $envRaw = $envRaw.TrimEnd() + "`r`nPUBLIC_ACCESS_URL=https://$hostname`r`n"
  }
  Set-Content -LiteralPath $envFile -Value $envRaw -Encoding UTF8
} else {
  Set-Content -LiteralPath $envFile -Value "PUBLIC_ACCESS_URL=https://$hostname`r`n" -Encoding UTF8
}
Write-Host "  [OK] Updated .env with PUBLIC_ACCESS_URL=https://$hostname" -ForegroundColor Green

Write-Host ""
Write-Host "Step 4: Binding DNS route ($hostname) and installing background auto-start..." -ForegroundColor Yellow
& $cloudflared tunnel route dns -f $tunnelName $hostname

& (Join-Path $PSScriptRoot "install-lan-autostart.ps1")
& (Join-Path $PSScriptRoot "install-cloudflare-autostart.ps1")

$restartScript = Join-Path $PSScriptRoot "restart-all-services.ps1"
if (Test-Path -LiteralPath $restartScript) {
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $restartScript
}

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "  [OK] Public domain bound and started: https://$hostname" -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Cyan
Read-Host "Press Enter to exit..."