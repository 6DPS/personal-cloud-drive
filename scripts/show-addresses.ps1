param(
  [switch]$NoPause
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$root = Split-Path -Parent $PSScriptRoot

# Read port and public access URL from .env
$port = "8081"
$publicUrl = ""
$envFile = Join-Path $root ".env"
if (Test-Path -LiteralPath $envFile) {
    foreach ($line in (Get-Content -LiteralPath $envFile -Encoding UTF8)) {
        if ($line -match "^\s*PORT\s*=\s*(.+)$") {
            $port = $matches[1].Trim('"', "'", " ")
        }
        if ($line -match "^\s*PUBLIC_ACCESS_URL\s*=\s*(.+)$") {
            $publicUrl = $matches[1].Trim('"', "'", " ")
        }
    }
}

# Filter physical LAN IPv4 addresses (exclude loopback, link-local, VPN/virtual adapters)
$allIps = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { 
    $_.IPAddress -notlike "127.*" -and 
    $_.IPAddress -notlike "169.254.*" -and 
    $_.IPAddress -notlike "198.18.*" -and 
    $_.IPAddress -notlike "172.21.*" -and
    $_.PrefixOrigin -ne "WellKnown" 
  }

# Check current Windows Firewall status
$fwStatus = "Not Configured"
$fwColor = "Yellow"
$fwRule = Get-NetFirewallRule -Name "DPSir-CloudDrive-LAN" -ErrorAction SilentlyContinue
if (-not $fwRule) {
    $fwRule = Get-NetFirewallRule -DisplayName "*DPSir*" -ErrorAction SilentlyContinue
}
if ($fwRule) {
    if ($fwRule.Profile -contains "Any" -or ($fwRule.Profile -contains "Public" -and $fwRule.Profile -contains "Private")) {
        $fwStatus = "[OK] Allowed on All Networks (Ethernet & Wi-Fi)"
        $fwColor = "Green"
    } else {
        $fwStatus = "[OK] Allowed (" + ($fwRule.Profile -join ",") + ")"
        $fwColor = "Green"
    }
}

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "      DPSir Personal Cloud Drive - Access Addresses & Status   " -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1. Local Access (This Computer)]" -ForegroundColor Green
Write-Host "  - http://127.0.0.1:$port" -ForegroundColor White
Write-Host "  - http://localhost:$port" -ForegroundColor Gray
Write-Host ""

Write-Host "[2. LAN Access (Phones / Tablets / PCs on Same Wi-Fi or LAN)]" -ForegroundColor Green
if ($allIps) {
    foreach ($item in $allIps) {
        $alias = $item.InterfaceAlias
        Write-Host "  - http://$($item.IPAddress):$port  ($alias)" -ForegroundColor Cyan
    }
} else {
    Write-Host "  - http://$($env:COMPUTERNAME):$port" -ForegroundColor Cyan
}
Write-Host "  - Hostname URL: http://$($env:COMPUTERNAME):$port" -ForegroundColor Gray
Write-Host ""
Write-Host "  [TIP] Mobile Browser Note:" -ForegroundColor Yellow
Write-Host "        Always include http:// at the beginning (e.g. http://192.168.0.102:8081)" -ForegroundColor White
Write-Host "        so mobile browsers do not default to https://." -ForegroundColor Gray
Write-Host ""

if ($publicUrl) {
    Write-Host "[3. Public Internet Access (Anywhere Outside Home)]" -ForegroundColor Green
    Write-Host "  - $publicUrl" -ForegroundColor Magenta
    Write-Host "  [INFO] Secured via HTTPS tunnel." -ForegroundColor Gray
    Write-Host ""
}

Write-Host "[4. Windows Firewall Status]" -ForegroundColor Green
Write-Host "  - Port 8081 Inbound Rule: $fwStatus" -ForegroundColor $fwColor
if ($fwStatus -eq "Not Configured") {
    Write-Host "  [INFO] If LAN devices cannot connect, run allow-lan-firewall-as-admin.bat as Administrator." -ForegroundColor Yellow
}
Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan

if (-not $NoPause) {
  Write-Host ""
  Read-Host "Press Enter to exit..."
  exit 0
}
