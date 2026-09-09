$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$taskName = "DPSir Personal Cloud Drive LAN"
$runner = Join-Path $PSScriptRoot "run-lan-drive-silent.vbs"

if (-not (Test-Path -LiteralPath $runner)) {
  throw "Cannot find runner script: $runner"
}

$action = New-ScheduledTaskAction `
  -Execute "wscript.exe" `
  -Argument "`"$runner`"" `
  -WorkingDirectory $root

$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Hours 0) `
  -RestartCount 3 `
  -RestartInterval (New-TimeSpan -Minutes 1)

Register-ScheduledTask `
  -TaskName $taskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description "Start DPSir Personal Cloud Drive on LAN after user logon." `
  -Force | Out-Null

Start-ScheduledTask -TaskName $taskName

$computerName = $env:COMPUTERNAME

Write-Host ""
Write-Host "LAN auto-start installed and started."
Write-Host ""
Write-Host "Try these stable LAN addresses from other devices on the same network:"
Write-Host "  http://$computerName`:8081"
Write-Host "  http://$computerName.local`:8081"
Write-Host ""
Write-Host "The IP can change when Wi-Fi/network changes, but these names usually stay the same."
Write-Host "If a phone cannot resolve the name, check the current IP with show-addresses.bat."
