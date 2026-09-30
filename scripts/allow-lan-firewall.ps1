param(
  [switch]$NoPause
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Continue"

$ports = "8081"
$ruleId = "DPSir-CloudDrive-LAN"
$displayName = "DPSir Personal Cloud Drive (Port 8081 LAN Allow)"
$legacyDisplayName = "DPSir Personal Cloud Drive LAN"

Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "       DPSir Personal Cloud Drive - Firewall Rule Setup        " -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Configure or update primary rule (DPSir-CloudDrive-LAN)
$existing = Get-NetFirewallRule -Name $ruleId -ErrorAction SilentlyContinue
if (-not $existing) {
    $existing = Get-NetFirewallRule -DisplayName $displayName -ErrorAction SilentlyContinue
}

if ($existing) {
    Set-NetFirewallRule -InputObject $existing -Enabled True -Direction Inbound -Action Allow -Profile Any -ErrorAction SilentlyContinue
    $existing | Get-NetFirewallPortFilter | Set-NetFirewallPortFilter -Protocol TCP -LocalPort $ports -ErrorAction SilentlyContinue
    Write-Host "  [OK] Updated firewall rule: $displayName [TCP 8081, All Profiles (Domain/Private/Public)]" -ForegroundColor Green
} else {
    New-NetFirewallRule `
        -Name $ruleId `
        -DisplayName $displayName `
        -Direction Inbound `
        -Action Allow `
        -Protocol TCP `
        -LocalPort $ports `
        -Profile Any `
        -ErrorAction SilentlyContinue | Out-Null
    Write-Host "  [OK] Created firewall rule: $displayName [TCP 8081, All Profiles (Domain/Private/Public)]" -ForegroundColor Green
}

# 2. Update legacy rule if exists
$legacy = Get-NetFirewallRule -DisplayName $legacyDisplayName -ErrorAction SilentlyContinue
if ($legacy) {
    Set-NetFirewallRule -InputObject $legacy -Enabled True -Direction Inbound -Action Allow -Profile Any -ErrorAction SilentlyContinue
    $legacy | Get-NetFirewallPortFilter | Set-NetFirewallPortFilter -Protocol TCP -LocalPort $ports -ErrorAction SilentlyContinue
    Write-Host "  [OK] Updated legacy rule: $legacyDisplayName [All Profiles]" -ForegroundColor Green
}

# 3. Synchronize Node.js runtime firewall rules
$nodeRules = Get-NetFirewallRule -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -eq "Node.js JavaScript Runtime" }
if ($nodeRules) {
    foreach ($nr in $nodeRules) {
        Set-NetFirewallRule -InputObject $nr -Enabled True -Action Allow -Profile Any -ErrorAction SilentlyContinue
    }
    Write-Host "  [OK] Updated Node.js runtime firewall rules [All Profiles]" -ForegroundColor Green
}

Write-Host ""
Write-Host "[OK] Firewall configuration complete. Devices on the same LAN can connect directly." -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan

if (-not $NoPause) {
  Write-Host ""
  Read-Host "Press Enter to exit..."
}
