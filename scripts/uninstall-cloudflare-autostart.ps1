$ErrorActionPreference = "Continue"

$taskName = "DPSir Personal Cloud Drive Cloudflare Tunnel"

if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
  Write-Host "[OK] Cloudflare tunnel auto-start scheduled task removed." -ForegroundColor Green
} else {
  Write-Host "[INFO] Cloudflare tunnel auto-start task was not installed." -ForegroundColor Cyan
}

# Immediately stop any running cloudflared process and background loop on this PC
Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.ProcessId -ne $PID -and $_.CommandLine -like "*run-cloudflare-domain-hidden.ps1*" } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Stop-Process -Name cloudflared -Force -ErrorAction SilentlyContinue
Write-Host "[OK] Stopped local Cloudflare tunnel process on this PC." -ForegroundColor Green
