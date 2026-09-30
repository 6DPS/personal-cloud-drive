param(
  [switch]$NoPause
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$root = Split-Path -Parent $PSScriptRoot

# 读取 .env 配置中的端口与公网域名
$port = "8081"
$publicUrl = ""
$envFile = Join-Path $root ".env"
if (Test-Path -LiteralPath $envFile) {
    foreach ($line in (Get-Content -LiteralPath $envFile -Encoding UTF8)) {
        if ($line -match "^\s*PORT\s*=\s*(.+)$") {
            $port = $matches[1].Trim('"', "'", " ")
        }
        if ($line -match "^\s*PUBLIC_ACCESS_URL\s*=\s*(.+)$") {
            $publicUrl = $matches[1].Trim('"', "'", " ")
        }
    }
}

# 过滤获取真实的局域网物理 IP（剔除虚拟网卡、VPN、WSL 等干扰）
$allIps = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { 
    $_.IPAddress -notlike "127.*" -and 
    $_.IPAddress -notlike "169.254.*" -and 
    $_.IPAddress -notlike "198.18.*" -and 
    $_.IPAddress -notlike "172.21.*" -and
    $_.PrefixOrigin -ne "WellKnown" 
  }

# 检查当前防火墙放行状态
$fwStatus = "待放行"
$fwColor = "Yellow"
$fwRule = Get-NetFirewallRule -Name "DPSir-CloudDrive-LAN" -ErrorAction SilentlyContinue
if (-not $fwRule) {
    $fwRule = Get-NetFirewallRule -DisplayName "*DPSir*" -ErrorAction SilentlyContinue
}
if ($fwRule) {
    if ($fwRule.Profile -contains "Any" -or ($fwRule.Profile -contains "Public" -and $fwRule.Profile -contains "Private")) {
        $fwStatus = "✓ 已全网放行（插网线/连 Wi-Fi 均畅通）"
        $fwColor = "Green"
    } else {
        $fwStatus = "✓ 已放行 (" + ($fwRule.Profile -join ",") + ")"
        $fwColor = "Green"
    }
}

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "           DPSir 个人网盘 - 访问地址与网络状态速查             " -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "【1. 本机极速访问】" -ForegroundColor Green
Write-Host "  - http://127.0.0.1:$port" -ForegroundColor White
Write-Host "  - http://localhost:$port" -ForegroundColor Gray
Write-Host ""

Write-Host "【2. 局域网访问（同一 Wi-Fi 或插网线的手机 / 平板 / 其他电脑）】" -ForegroundColor Green
if ($allIps) {
    foreach ($item in $allIps) {
        $alias = $item.InterfaceAlias
        Write-Host "  - http://$($item.IPAddress):$port  ($alias)" -ForegroundColor Cyan
    }
} else {
    Write-Host "  - http://$($env:COMPUTERNAME):$port" -ForegroundColor Cyan
}
Write-Host "  - 电脑主机名直达: http://$($env:COMPUTERNAME):$port" -ForegroundColor Gray
Write-Host ""
Write-Host "  💡【手机访问特别提示】" -ForegroundColor Yellow
Write-Host "     在手机浏览器输入时，请务必完整输入开头的 http:// （例如 http://192.168.0.102:8081）" -ForegroundColor White
Write-Host "     切勿遗漏，以防手机自带浏览器偷换为 https:// 导致显示打不开。" -ForegroundColor Gray
Write-Host ""

if ($publicUrl) {
    Write-Host "【3. 公网远程访问（出门在外随时随地，无需连家里网络）】" -ForegroundColor Green
    Write-Host "  - $publicUrl" -ForegroundColor Magenta
    Write-Host "  💡 自带安全加密与全国加速，受手机 VPN 或防火墙影响最小。" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "【4. 系统防火墙通行状态】" -ForegroundColor Green
Write-Host "  - 8081 端口入站规则: $fwStatus" -ForegroundColor $fwColor
if ($fwStatus -eq "待放行") {
    Write-Host "  [提示] 若局域网手机无法连入，可随时双击 allow-lan-firewall-as-admin.bat 一键放行。" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan

if (-not $NoPause) {
  Write-Host ""
  Read-Host "按回车键退出..."
  exit 0
}
