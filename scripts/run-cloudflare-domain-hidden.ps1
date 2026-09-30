$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
. (Join-Path $PSScriptRoot "cloudflared-common.ps1")

$cloudflared = Get-Cloudflared -Root $root
$configPath = Join-Path $root ".cloudflared\config.yml"
$logDir = Join-Path $root "logs"

if (-not (Test-Path -LiteralPath $configPath)) {
  throw "Cloudflare tunnel config not found. Run setup-cloudflare-domain.bat first."
}

$localCred = Join-Path $root ".cloudflared\9a130b3a-6849-447e-b800-ed830e19e83a.json"
if (Test-Path -LiteralPath $localCred) {
  $cfgText = Get-Content -LiteralPath $configPath -Raw
  $updated = $cfgText -replace "credentials-file:.*", "credentials-file: $localCred"
  Set-Content -LiteralPath $configPath -Value $updated -Encoding UTF8
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
      -ArgumentList @("tunnel", "--edge-ip-version", "4", "--config", $configPath, "run") `
      -WorkingDirectory $root `
      -WindowStyle Hidden `
      -RedirectStandardOutput (Join-Path $logDir "cloudflared.out.log") `
      -RedirectStandardError (Join-Path $logDir "cloudflared.err.log")

    Start-Sleep -Seconds 10

    $started = Get-ExistingTunnelProcess
    if ($started) {
      return $started
    }

    if ($attempt -lt $maxAttempts) {
      Start-Sleep -Seconds 5
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
    $resp = Invoke-WebRequest -Uri "http://127.0.0.1:20241/ready" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    if ($resp.StatusCode -lt 200 -or $resp.StatusCode -ge 400) { return $false }
    $localResp = Invoke-WebRequest -Uri "http://127.0.0.1:8081/api/me" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    return ($localResp.StatusCode -ge 200 -and $localResp.StatusCode -lt 400)
  } catch {
    return $false
  }
}

$tunnelProcess = Start-TunnelWithRetries
if (-not $tunnelProcess) {
  throw "Cloudflare tunnel did not stay running after multiple start attempts."
}

$unhealthyCount = 0
$maxUnhealthyBeforeRestart = 2

while ($true) {
  Ensure-Drive-Running -Root $root

  $tunnelProcess = Get-ExistingTunnelProcess
  if (-not $tunnelProcess) {
    $tunnelProcess = Start-TunnelWithRetries
    if (-not $tunnelProcess) {
      Start-Sleep -Seconds 10
      continue
    }
    $unhealthyCount = 0
  }

  Start-Sleep -Seconds 10

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
      Start-Sleep -Seconds 2
      $tunnelProcess = Start-TunnelWithRetries
      $unhealthyCount = 0
    }
  }
}

