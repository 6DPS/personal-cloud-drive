$ips = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" -and $_.IPAddress -notlike "198.18.*" -and $_.PrefixOrigin -ne "WellKnown" } |
  Select-Object -ExpandProperty IPAddress
$profiles = Get-NetConnectionProfile |
  Select-Object Name, InterfaceAlias, NetworkCategory, IPv4Connectivity

Write-Host ""
Write-Host "Local address:"
Write-Host "  http://127.0.0.1:8081"
Write-Host ""
Write-Host "LAN addresses:"
foreach ($ip in $ips) {
  Write-Host "  http://$($ip):8081"
}

Write-Host ""
Write-Host "Stable LAN names to try:"
Write-Host "  http://$($env:COMPUTERNAME):8081"
Write-Host "  http://$($env:COMPUTERNAME).local:8081"
Write-Host ""
Write-Host "Current network profile:"
foreach ($profile in $profiles) {
  Write-Host "  $($profile.InterfaceAlias): $($profile.Name) / $($profile.NetworkCategory) / $($profile.IPv4Connectivity)"
}
Write-Host ""
Write-Host "After switching Wi-Fi/network:"
Write-Host "  1. Try the stable LAN name first."
Write-Host "  2. If that does not resolve, run this file and use the current LAN IP above."
Write-Host "  3. If another device still cannot open it, run allow-lan-firewall-as-admin.bat once."
pause
