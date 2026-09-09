$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
. (Join-Path $PSScriptRoot "cloudflared-common.ps1")

$cloudflared = Get-Cloudflared -Root $root
$tunnelName = "dpsir-cloud-drive"
$configDir = Join-Path $root ".cloudflared"
$configPath = Join-Path $configDir "config.yml"
$hostnamePath = Join-Path $configDir "hostname.txt"

New-Item -ItemType Directory -Force -Path $configDir | Out-Null

Write-Host ""
Write-Host "Fixed domain access requires:"
Write-Host "1. You own a domain."
Write-Host "2. The domain is managed by Cloudflare."
Write-Host "3. A browser will open for Cloudflare login."
Write-Host ""

$hostname = Read-Host "Enter the domain to bind, for example pan.example.com"
if (-not $hostname -or $hostname -notmatch "\.") {
  Write-Host "Invalid domain."
  pause
  exit 1
}

$secure = Read-Host "Set a cloud drive password for fixed domain access" -AsSecureString
$plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringUni(
  [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
)
if (-not $plainPassword -or $plainPassword.Length -lt 8) {
  Write-Host "Password must be at least 8 characters."
  pause
  exit 1
}
[Environment]::SetEnvironmentVariable("CLOUD_DRIVE_PASSWORD", $plainPassword, "User")
$env:CLOUD_DRIVE_PASSWORD = $plainPassword

& $cloudflared tunnel login
& $cloudflared tunnel create $tunnelName

$json = & $cloudflared tunnel info $tunnelName --output json | ConvertFrom-Json
$tunnelId = $json.id
if (-not $tunnelId) {
  Write-Host "Could not get Tunnel ID. Check whether cloudflared login succeeded."
  pause
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

& $cloudflared tunnel route dns $tunnelName $hostname

& (Join-Path $PSScriptRoot "install-lan-autostart.ps1")
& (Join-Path $PSScriptRoot "install-cloudflare-autostart.ps1")

Write-Host ""
Write-Host "Cloudflare fixed domain tunnel configured."
Write-Host "Auto-start tasks are installed. Your fixed address is:"
Write-Host "https://$hostname"
pause
