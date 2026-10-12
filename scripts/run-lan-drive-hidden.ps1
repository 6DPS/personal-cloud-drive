$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$port = if ($env:PORT) { [int]$env:PORT } else { 8081 }

# Auto-detect common Node.js installation paths in case PATH is incomplete in Task Scheduler
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
foreach ($keyName in @("YUNPAN_DEEPSEEK_KEY", "DEEPSEEK_API_KEY")) {
  if (-not [Environment]::GetEnvironmentVariable($keyName, "Process")) {
    $val = [Environment]::GetEnvironmentVariable($keyName, "User")
    if (-not $val) { $val = [Environment]::GetEnvironmentVariable($keyName, "Machine") }
    if ($val) { [Environment]::SetEnvironmentVariable($keyName, $val, "Process") }
  }
}
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
