$ErrorActionPreference = "Stop"

$ruleName = "DPSir Personal Cloud Drive LAN"
$ports = "8081"

$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($existing) {
  Set-NetFirewallRule -DisplayName $ruleName -Enabled True -Direction Inbound -Action Allow -Profile Any
  Set-NetFirewallPortFilter -AssociatedNetFirewallRule $existing -Protocol TCP -LocalPort $ports
} else {
  New-NetFirewallRule `
    -DisplayName $ruleName `
    -Direction Inbound `
    -Action Allow `
    -Protocol TCP `
    -LocalPort $ports `
    -Profile Any | Out-Null
}

Write-Host "Firewall rule is ready: $ruleName ($ports)"
