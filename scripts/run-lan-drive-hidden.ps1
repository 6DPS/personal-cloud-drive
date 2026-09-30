$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$port = if ($env:PORT) { [int]$env:PORT } else { 8081 }

# 自动适配常见 Node.js 安装路径，防止计划任务环境下 PATH 缺失
$nodeExe = "node.exe"
$commonNodeDirs = @(
    "C:\Program Files\nodejs",
    "C:\Program Files (x86)\nodejs",
    "$env:LOCALAPPDATA\Programs\nodejs",
    "$env:APPDATA\nvm"
)
foreach ($dir in $commonNodeDirs) {
    $candidate = Join-Path $dir "node.exe"
    if (Test-Path -LiteralPath $candidate) {
        $nodeExe = $candidate
        if ($env:Path -notlike "*$dir*") {
            $env:Path = "$dir;" + $env:Path
        }
        break
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
  -FilePath $nodeExe `
  -ArgumentList "scripts\server-watchdog.js" `
  -WorkingDirectory $root `
  -WindowStyle Hidden `
  -RedirectStandardOutput (Join-Path $logDir "lan-drive.out.log") `
  -RedirectStandardError (Join-Path $logDir "lan-drive.err.log")
