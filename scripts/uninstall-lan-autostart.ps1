$ErrorActionPreference = "Stop"

$taskName = "DPSir Personal Cloud Drive LAN"

if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
  Write-Host "LAN auto-start removed."
} else {
  Write-Host "LAN auto-start task was not installed."
}
