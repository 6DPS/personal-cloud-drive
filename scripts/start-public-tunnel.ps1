$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
. (Join-Path $PSScriptRoot "cloudflared-common.ps1")

$cloudflared = Get-Cloudflared -Root $root

# Clean up any orphan cloudflared process before starting
Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Ensure-Drive-Running -Root $root

Write-Host ""
Write-Host "Starting temporary public tunnel."
Write-Host "When you see https://*.trycloudflare.com, share that address."
Write-Host ""
& $cloudflared tunnel --url http://127.0.0.1:8081
