$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$port = if ($env:PORT) { [int]$env:PORT } else { 8081 }

function Test-PortOpen {
  param([int]$Port)
  try {
    $client = [Net.Sockets.TcpClient]::new()
    $async = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
    if (-not $async.AsyncWaitHandle.WaitOne(500)) {
      $client.Close()
      return $false
    }
    $client.EndConnect($async)
    $client.Close()
    return $true
  } catch {
    return $false
  }
}

$env:HOST = "0.0.0.0"
$env:PORT = [string]$port
$passwordPath = Join-Path $root ".cloudflared\cloud-drive-password.txt"
if (Test-Path -LiteralPath $passwordPath) {
  $env:CLOUD_DRIVE_PASSWORD = (Get-Content -LiteralPath $passwordPath -Raw).Trim()
}
$logDir = Join-Path $root "logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

Start-Process `
  -FilePath "node.exe" `
  -ArgumentList "scripts\server-watchdog.js" `
  -WorkingDirectory $root `
  -WindowStyle Hidden `
  -RedirectStandardOutput (Join-Path $logDir "lan-drive.out.log") `
  -RedirectStandardError (Join-Path $logDir "lan-drive.err.log")
