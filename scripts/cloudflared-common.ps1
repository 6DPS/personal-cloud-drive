function Get-Cloudflared {
  param([Parameter(Mandatory = $true)][string]$Root)

  $tools = Join-Path $Root "tools"
  $cloudflared = Join-Path $tools "cloudflared.exe"
  $url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"

  New-Item -ItemType Directory -Force -Path $tools | Out-Null
  if (-not (Test-Path -LiteralPath $cloudflared)) {
    Write-Host "Downloading Cloudflare Tunnel tool for first-time use..."
    Invoke-WebRequest -Uri $url -OutFile $cloudflared
  }
  return $cloudflared
}

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

function Ensure-Drive-Running {
  param([Parameter(Mandatory = $true)][string]$Root)

  Write-Host "Ensuring DPSir cloud drive watchdog is running..."
  $env:HOST = "0.0.0.0"
  $env:PORT = "8081"

  Start-Process `
    -FilePath "node.exe" `
    -ArgumentList "scripts\server-watchdog.js" `
    -WorkingDirectory $Root `
    -WindowStyle Hidden

  for ($i = 0; $i -lt 12; $i++) {
    if (Test-PortOpen -Port 8081) {
      return
    }
    Start-Sleep -Seconds 1
  }
}
