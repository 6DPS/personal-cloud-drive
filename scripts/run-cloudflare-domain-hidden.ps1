$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
. (Join-Path $PSScriptRoot "cloudflared-common.ps1")

$cloudflared = Get-Cloudflared -Root $root
$configPath = Join-Path $root ".cloudflared\config.yml"
$logDir = Join-Path $root "logs"

if (-not (Test-Path -LiteralPath $configPath)) {
  throw "Cloudflare tunnel config not found. Run setup-cloudflare-domain.bat first."
}

if (-not $env:CLOUD_DRIVE_PASSWORD) {
  $passwordPath = Join-Path $root ".cloudflared\cloud-drive-password.txt"
  if (Test-Path -LiteralPath $passwordPath) {
    $env:CLOUD_DRIVE_PASSWORD = (Get-Content -LiteralPath $passwordPath -Raw).Trim()
  }
}

if (-not $env:CLOUD_DRIVE_PASSWORD) {
  throw "CLOUD_DRIVE_PASSWORD is not set. Run setup-cloudflare-domain.bat again."
}

Ensure-Drive-Running -Root $root
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

function Get-ExistingTunnelProcess {
  Get-CimInstance Win32_Process -Filter "Name = 'cloudflared.exe'" |
    Where-Object { $_.CommandLine -like "*$configPath*" } |
    Sort-Object ProcessId |
    Select-Object -First 1
}

function Start-TunnelWithRetries {
  $maxAttempts = 6

  $existing = Get-ExistingTunnelProcess
  if ($existing) {
    return $existing
  }

  for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
    Start-Process `
      -FilePath $cloudflared `
      -ArgumentList @("tunnel", "--config", $configPath, "run") `
      -WorkingDirectory $root `
      -WindowStyle Hidden `
      -RedirectStandardOutput (Join-Path $logDir "cloudflared.out.log") `
      -RedirectStandardError (Join-Path $logDir "cloudflared.err.log")

    Start-Sleep -Seconds 15

    $started = Get-ExistingTunnelProcess
    if ($started) {
      return $started
    }

    if ($attempt -lt $maxAttempts) {
      Start-Sleep -Seconds 10
    }
  }

  return $null
}

function Wait-ForTunnelExit {
  param([Parameter(Mandatory = $true)][int]$ProcessId)

  try {
    Wait-Process -Id $ProcessId -ErrorAction Stop
  } catch {
    Start-Sleep -Seconds 3
  }
}

$existingRunner = Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe'" |
  Where-Object { $_.ProcessId -ne $PID -and $_.CommandLine -like "*run-cloudflare-domain-hidden.ps1*" } |
  Select-Object -First 1

if ($existingRunner) {
  exit 0
}

function Test-TunnelHealthy {
  try {
    $resp = Invoke-WebRequest -Uri "http://127.0.0.1:20241/ready" -UseBasicParsing -TimeoutSec 4 -ErrorAction Stop
    return ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 400)
  } catch {
    return $false
  }
}

$tunnelProcess = Start-TunnelWithRetries
if (-not $tunnelProcess) {
  throw "Cloudflare tunnel did not stay running after multiple start attempts."
}

$unhealthyCount = 0
$maxUnhealthyBeforeRestart = 4

while ($true) {
  Ensure-Drive-Running -Root $root

  $tunnelProcess = Get-ExistingTunnelProcess
  if (-not $tunnelProcess) {
    $tunnelProcess = Start-TunnelWithRetries
    if (-not $tunnelProcess) {
      Start-Sleep -Seconds 15
      continue
    }
    $unhealthyCount = 0
  }

  Start-Sleep -Seconds 20

  $tunnelProcess = Get-ExistingTunnelProcess
  if (-not $tunnelProcess) {
    $unhealthyCount = 0
    continue
  }

  if (Test-TunnelHealthy) {
    $unhealthyCount = 0
  } else {
    $unhealthyCount++
    if ($unhealthyCount -ge $maxUnhealthyBeforeRestart) {
      Stop-Process -Id $tunnelProcess.ProcessId -Force -ErrorAction SilentlyContinue
      Start-Sleep -Seconds 3
      $tunnelProcess = Start-TunnelWithRetries
      $unhealthyCount = 0
    }
  }
}

