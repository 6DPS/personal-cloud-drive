$ErrorActionPreference = "Stop"

$taskName = "DPSir Personal Cloud Drive Cloudflare Tunnel"

if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
  Write-Host "Cloudflare tunnel auto-start removed."
} else {
  Write-Host "Cloudflare tunnel auto-start task was not installed."
}
