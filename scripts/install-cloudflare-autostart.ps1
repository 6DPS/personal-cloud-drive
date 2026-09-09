$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$taskName = "DPSir Personal Cloud Drive Cloudflare Tunnel"
$runner = Join-Path $PSScriptRoot "run-cloudflare-domain-silent.vbs"
$configPath = Join-Path $root ".cloudflared\config.yml"

if (-not (Test-Path -LiteralPath $configPath)) {
  throw "Cloudflare tunnel config not found. Run setup-cloudflare-domain.bat first."
}

$action = New-ScheduledTaskAction `
  -Execute "wscript.exe" `
  -Argument "`"$runner`"" `
  -WorkingDirectory $root

$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$trigger.Delay = "PT1M"
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
  -Description "Start DPSir Personal Cloud Drive Cloudflare Tunnel after user logon." `
  -Force | Out-Null

Start-ScheduledTask -TaskName $taskName

Write-Host ""
Write-Host "Cloudflare tunnel auto-start installed and started."
