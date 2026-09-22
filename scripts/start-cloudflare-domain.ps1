$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
. (Join-Path $PSScriptRoot "cloudflared-common.ps1")

$cloudflared = Get-Cloudflared -Root $root
$configPath = Join-Path $root ".cloudflared\config.yml"

if (-not (Test-Path -LiteralPath $configPath)) {
  Write-Host "Fixed domain tunnel is not configured yet. Run setup-cloudflare-domain.bat first."
  pause
  exit 1
}

$localCred = Join-Path $root ".cloudflared\9a130b3a-6849-447e-b800-ed830e19e83a.json"
if (Test-Path -LiteralPath $localCred) {
  $cfgText = Get-Content -LiteralPath $configPath -Raw
  $updated = $cfgText -replace "credentials-file:.*", "credentials-file: $localCred"
  Set-Content -LiteralPath $configPath -Value $updated -Encoding UTF8
}

# Check if tunnel is already running and healthy in background
$existing = Get-CimInstance Win32_Process -Filter "Name = 'cloudflared.exe'" |
  Where-Object { $_.CommandLine -like "*$configPath*" } |
  Select-Object -First 1

if ($existing) {
  $isReady = $false
  try {
    $resp = Invoke-WebRequest -Uri "http://127.0.0.1:20241/ready" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 400) { $isReady = $true }
  } catch {}

  if ($isReady) {
    Write-Host ""
    Write-Host "======================================================"
    Write-Host "  [提示] Cloudflare 固定域名公网隧道已经在后台稳定运行中！"
    Write-Host "  公网访问地址: $(if ($env:PUBLIC_ACCESS_URL) { $env:PUBLIC_ACCESS_URL } else { "https://你的域名.com" })"
    Write-Host "  后台进程 PID: $($existing.ProcessId) (健康状态: 正常 200)"
    Write-Host "  无需重复启动，保持后台常驻即可。"
    Write-Host "======================================================"
    Write-Host ""
    pause
    exit 0
  }
}

# Clean up any orphan or unhealthy cloudflared process before starting
Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Ensure-Drive-Running -Root $root

Write-Host ""
Write-Host "======================================================"
Write-Host "  正在启动 Cloudflare 固定域名公网隧道..."
Write-Host "  公网访问地址: $(if ($env:PUBLIC_ACCESS_URL) { $env:PUBLIC_ACCESS_URL } else { "https://你的域名.com" })"
Write-Host "  请保持此窗口开启；关闭此窗口将断开公网访问。"
Write-Host "======================================================"
Write-Host ""

& $cloudflared tunnel --config $configPath run
