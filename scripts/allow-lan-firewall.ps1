[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Continue"

$ports = "8081"
$ruleId = "DPSir-CloudDrive-LAN"
$displayName = "DPSir 个人网盘 (8081 局域网放行)"
$legacyDisplayName = "DPSir Personal Cloud Drive LAN"

Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "       DPSir 个人网盘 - Windows 防火墙全网络自动放行工具       " -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. 配置或更新主要专用规则 (DPSir-CloudDrive-LAN)
$existing = Get-NetFirewallRule -Name $ruleId -ErrorAction SilentlyContinue
if (-not $existing) {
    $existing = Get-NetFirewallRule -DisplayName $displayName -ErrorAction SilentlyContinue
}

if ($existing) {
    Set-NetFirewallRule -InputObject $existing -Enabled True -Direction Inbound -Action Allow -Profile Any -ErrorAction SilentlyContinue
    $existing | Get-NetFirewallPortFilter | Set-NetFirewallPortFilter -Protocol TCP -LocalPort $ports -ErrorAction SilentlyContinue
    Write-Host "  ✓ 已成功刷新专属放行规则: $displayName [TCP 8081, 所有网络(公用+专用+域)]" -ForegroundColor Green
} else {
    New-NetFirewallRule `
        -Name $ruleId `
        -DisplayName $displayName `
        -Direction Inbound `
        -Action Allow `
        -Protocol TCP `
        -LocalPort $ports `
        -Profile Any `
        -ErrorAction SilentlyContinue | Out-Null
    Write-Host "  ✓ 已成功创建专属放行规则: $displayName [TCP 8081, 所有网络(公用+专用+域)]" -ForegroundColor Green
}

# 2. 兼容性旧规则 (DPSir Personal Cloud Drive LAN) 统一更新为 Any
$legacy = Get-NetFirewallRule -DisplayName $legacyDisplayName -ErrorAction SilentlyContinue
if ($legacy) {
    Set-NetFirewallRule -InputObject $legacy -Enabled True -Direction Inbound -Action Allow -Profile Any -ErrorAction SilentlyContinue
    $legacy | Get-NetFirewallPortFilter | Set-NetFirewallPortFilter -Protocol TCP -LocalPort $ports -ErrorAction SilentlyContinue
    Write-Host "  ✓ 已同步刷新兼容规则: $legacyDisplayName [全网络放行]" -ForegroundColor Green
}

# 3. 检查并同步放行 Node.js 原生规则（防止切换网络类型后被拦截）
$nodeRules = Get-NetFirewallRule -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -eq "Node.js JavaScript Runtime" }
if ($nodeRules) {
    foreach ($nr in $nodeRules) {
        Set-NetFirewallRule -InputObject $nr -Enabled True -Action Allow -Profile Any -ErrorAction SilentlyContinue
    }
    Write-Host "  ✓ 已将 Node.js 原生运行环境防火墙规则同步提升为 [全网络放行]" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 防火墙配置完毕！局域网内所有手机、平板、电脑均可直接畅通连接。" -ForegroundColor Cyan
Write-Host "===============================================================" -ForegroundColor Cyan
