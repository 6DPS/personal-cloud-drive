# ==============================================================================
# DPSir 个人网盘 - 一键全服务重启与自动修复助手
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Continue"

$root = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $root

$envPath = Join-Path $root ".env"
if (Test-Path -LiteralPath $envPath) {
    Get-Content -LiteralPath $envPath | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line -match "^([^=]+)=(.*)$") {
            $k = $matches[1].Trim()
            $v = $matches[2].Trim().Trim('"').Trim("'")
            [Environment]::SetEnvironmentVariable($k, $v)
        }
    }
}

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "         DPSir 个人网盘 - 一键全服务重启与自动修复助手         " -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/3] 正在安全释放可能卡顿的旧后台进程..." -ForegroundColor Yellow
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Stop-Process -Name cloudflared -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
Write-Host "  ✓ 旧进程已安全释放" -ForegroundColor Green

# 智能自愈：核验防火墙规则是否覆盖全网络 (Profile: Any)
$fw = Get-NetFirewallRule -Name "DPSir-CloudDrive-LAN" -ErrorAction SilentlyContinue
if (-not $fw -or $fw.Profile -ne "Any") {
    $allowScript = Join-Path $PSScriptRoot "allow-lan-firewall.ps1"
    if (Test-Path -LiteralPath $allowScript) {
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $allowScript
    }
}

Write-Host ""
Write-Host "[2/3] 正在重新唤醒网盘核心服务与 Cloudflare 公网隧道..." -ForegroundColor Yellow

$lanTask = Get-ScheduledTask -TaskName "DPSir Personal Cloud Drive LAN" -ErrorAction SilentlyContinue
if ($lanTask) {
    Start-ScheduledTask -TaskName "DPSir Personal Cloud Drive LAN" -ErrorAction SilentlyContinue
} else {
    $lanVbs = Join-Path $PSScriptRoot "run-lan-drive-silent.vbs"
    if (Test-Path -LiteralPath $lanVbs) {
        Start-Process "wscript.exe" -ArgumentList "`"$lanVbs`"" -WorkingDirectory $root
    }
}

$cfTask = Get-ScheduledTask -TaskName "DPSir Personal Cloud Drive Cloudflare Tunnel" -ErrorAction SilentlyContinue
if ($cfTask) {
    Start-ScheduledTask -TaskName "DPSir Personal Cloud Drive Cloudflare Tunnel" -ErrorAction SilentlyContinue
} else {
    $cfVbs = Join-Path $PSScriptRoot "run-cloudflare-domain-silent.vbs"
    if (Test-Path -LiteralPath $cfVbs) {
        Start-Process "wscript.exe" -ArgumentList "`"$cfVbs`"" -WorkingDirectory $root
    }
}

Write-Host "  ✓ 服务启动指令已就绪，正在等待网络握手 (约 4 秒)..." -ForegroundColor Green
Start-Sleep -Seconds 4

Write-Host ""
Write-Host "[3/3] 正在对本地与公网链路进行健康体检..." -ForegroundColor Yellow

$localOk = $false
try {
    $resp1 = Invoke-WebRequest -Uri "http://127.0.0.1:8081/api/me" -UseBasicParsing -TimeoutSec 4 -ErrorAction Stop
    if ($resp1.StatusCode -eq 200) { $localOk = $true }
} catch {}

$publicOk = $false
try {
    $publicTarget = if ($env:PUBLIC_ACCESS_URL) { $env:PUBLIC_ACCESS_URL } else { "https://pan.yourdomain.com" }; if ($env:PUBLIC_ACCESS_URL) { $resp2 = Invoke-WebRequest -Uri "$publicTarget/api/me" -UseBasicParsing -TimeoutSec 6 -ErrorAction SilentlyContinue }
    if ($resp2.StatusCode -eq 200) { $publicOk = $true }
} catch {}

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
if ($localOk -and $publicOk) {
    Write-Host "        🎉 恭喜！网盘所有服务已完美重启，状态 100% 正常！       " -ForegroundColor Green
} elseif ($localOk) {
    Write-Host "        ✓ 本地服务已恢复正常，公网域名正在握手连通中...        " -ForegroundColor Yellow
} else {
    Write-Host "        [提示] 服务正在后台拉起，请稍后刷新浏览器即可。        " -ForegroundColor Yellow
}
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""
$domainStr = if ($env:PUBLIC_ACCESS_URL) { $env:PUBLIC_ACCESS_URL } else { '未配置公网域名' }
$localStatus = if ($localOk) { '正常在线 [OK]' } else { '启动中...' }
$publicStatus = if ($publicOk) { '正常在线 [OK]' } else { '握手中...' }
Write-Host "  1. 本地局域网: http://127.0.0.1:8081  --> $localStatus" -ForegroundColor $(if ($localOk) { 'Green' } else { 'Yellow' })
Write-Host "  2. 外网公网域名: $domainStr  --> $publicStatus" -ForegroundColor $(if ($publicOk) { 'Green' } else { 'Yellow' })
Write-Host ''
Write-Host '现在您可以直接回到浏览器按【F5】刷新网页了！' -ForegroundColor Cyan
Write-Host ''
