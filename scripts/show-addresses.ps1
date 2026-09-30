param(
  [switch]$NoPause
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$root = Split-Path -Parent $PSScriptRoot

# Read PORT and PUBLIC_ACCESS_URL from .env
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

# Filter physical IPv4 addresses (exclude virtual adapters, VPN, WSL)
$allIps = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { 
    $_.IPAddress -notlike "127.*" -and 
    $_.IPAddress -notlike "169.254.*" -and 
    $_.IPAddress -notlike "198.18.*" -and 
    $_.IPAddress -notlike "172.21.*" -and
    $_.PrefixOrigin -ne "WellKnown" 
  }

# Check firewall status
$fwStatus = "Pending"
$fwColor = "Yellow"
$fwRule = Get-NetFirewallRule -Name "DPSir-CloudDrive-LAN" -ErrorAction SilentlyContinue
if (-not $fwRule) {
    $fwRule = Get-NetFirewallRule -DisplayName "*DPSir*" -ErrorAction SilentlyContinue
}
if ($fwRule) {
    if ($fwRule.Profile -contains "Any" -or ($fwRule.Profile -contains "Public" -and $fwRule.Profile -contains "Private")) {
        $fwStatus = "Allowed (All Profiles: Wi-Fi / Cable)"
        $fwColor = "Green"
    } else {
        $fwStatus = "Allowed (" + ($fwRule.Profile -join ",") + ")"
        $fwColor = "Green"
    }
}

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "     DPSir Personal Cloud Drive - Access URLs & Status         " -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1. Local Machine Access]" -ForegroundColor Green
Write-Host "  - http://127.0.0.1:$port" -ForegroundColor White
Write-Host "  - http://localhost:$port" -ForegroundColor Gray
Write-Host ""

Write-Host "[2. Local Network (LAN) Access (Phone, Tablet, PC on same Wi-Fi / Cable)]" -ForegroundColor Green
if ($allIps) {
    foreach ($item in $allIps) {
        $alias = $item.InterfaceAlias
        Write-Host "  - http://$($item.IPAddress):$port  ($alias)" -ForegroundColor Cyan
    }
} else {
    Write-Host "  - http://$($env:COMPUTERNAME):$port" -ForegroundColor Cyan
}
Write-Host "  - Hostname: http://$($env:COMPUTERNAME):$port" -ForegroundColor Gray
Write-Host ""
Write-Host "  * Mobile Browser Tip:" -ForegroundColor Yellow
Write-Host "    Make sure to type 'http://' explicitly (e.g. http://192.168.0.102:8081)." -ForegroundColor White
Write-Host "    Do not omit 'http://', otherwise mobile browsers may force https:// and fail." -ForegroundColor Gray
Write-Host ""

if ($publicUrl) {
    Write-Host "[3. Public Remote Access (Anywhere outside home)]" -ForegroundColor Green
    Write-Host "  - $publicUrl" -ForegroundColor Magenta
    Write-Host ""
}

Write-Host "[4. Windows Firewall Status]" -ForegroundColor Green
Write-Host "  - Port 8081 Rule: $fwStatus" -ForegroundColor $fwColor
if ($fwStatus -eq "Pending") {
    Write-Host "  [Notice] If mobile devices cannot connect, run allow-lan-firewall-as-admin.bat" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan

if (-not $NoPause) {
  Write-Host ""
  Read-Host "Press Enter to exit..."
}
