function Get-Cloudflared {
  param([Parameter(Mandatory = $true)][string]$Root)

  $tools = Join-Path $Root "tools"
  $cloudflared = Join-Path $tools "cloudflared.exe"
  $officialUrl = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
  $mirrors = @(
    "https://gh-proxy.com/$officialUrl",
    "https://ghfast.top/$officialUrl",
    "https://ghproxy.net/$officialUrl",
    "https://gh.llkk.cc/$officialUrl",
    $officialUrl
  )

  New-Item -ItemType Directory -Force -Path $tools | Out-Null
  if (-not (Test-Path -LiteralPath $cloudflared)) {
    Write-Host "Downloading Cloudflare Tunnel tool via domestic mirror..."
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    foreach ($url in $mirrors) {
      try {
        Write-Host "  -> Trying mirror: $url"
        Invoke-WebRequest -Uri $url -OutFile $cloudflared -TimeoutSec 60 -UseBasicParsing
        if ((Test-Path -LiteralPath $cloudflared) -and (Get-Item -LiteralPath $cloudflared).Length -gt 10MB) {
          Write-Host "  [OK] Downloaded cloudflared.exe successfully."
          break
        }
      } catch {
        if (Test-Path -LiteralPath $cloudflared) {
          Remove-Item -LiteralPath $cloudflared -Force -ErrorAction SilentlyContinue
        }
      }
    }
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

  # Fast check: if port 8081 is already open, return immediately to avoid spawning unnecessary processes
  if (Test-PortOpen -Port 8081) {
    return
  }

  Write-Host "Drive service is offline. Starting watchdog daemon..."
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
