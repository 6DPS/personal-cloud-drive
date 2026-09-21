# ==============================================================================
# DPSir 个人网盘 - Windows 小主机/新电脑一键部署与迁移配置脚本
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Continue"

$root = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $root

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "       DPSir 个人网盘 - Windows 小主机/新电脑 一键部署向导      " -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. 检查 Node.js 环境
Write-Host "[1/5] 正在检查 Node.js 运行环境..." -ForegroundColor Green
$nodeCmd = Get-Command "node" -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host "  未检测到 Node.js，正在尝试通过 Windows 自带的 winget 自动安装 LTS 版本..." -ForegroundColor Yellow
    $wingetCmd = Get-Command "winget" -ErrorAction SilentlyContinue
    if ($wingetCmd) {
        Write-Host "  正在执行: winget install OpenJS.NodeJS.LTS ..." -ForegroundColor Gray
        Start-Process "winget" -ArgumentList "install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements" -Wait
        # 刷新当前进程 PATH 并自动适配常见安装路径
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        if (Test-Path "C:\Program Files\nodejs\node.exe") {
            $env:Path = "C:\Program Files\nodejs;" + $env:Path
        }
        $nodeCmd = Get-Command "node" -ErrorAction SilentlyContinue
    }
    
    if (-not $nodeCmd) {
        Write-Host "  [提示] 自动安装未能直接就绪，请手动下载安装 Node.js LTS:" -ForegroundColor Red
        Write-Host "  官方下载地址: https://nodejs.org/" -ForegroundColor Yellow
        Write-Host "  安装完成后重新双击运行本脚本即可！" -ForegroundColor Yellow
        Read-Host "按回车键退出..."
        exit 1
    }
}
$nodeVersion = node -v
Write-Host "  ✓ Node.js 已就绪: $nodeVersion" -ForegroundColor Green

# 2. 检查并配置存储路径 (STORAGE_BASE_ROOT)
Write-Host ""
Write-Host "[2/5] 正在配置网盘数据存储路径..." -ForegroundColor Green

$envFilePath = Join-Path $root ".env"
$currentStorage = ""
if (Test-Path -LiteralPath $envFilePath) {
    $lines = Get-Content -LiteralPath $envFilePath -Encoding UTF8
    foreach ($line in $lines) {
        if ($line -match "^\s*STORAGE_BASE_ROOT\s*=\s*(.+)$") {
            $currentStorage = $matches[1].Trim('"', "'", " ")
        }
    }
}

if (-not $currentStorage) {
    if (Test-Path "D:\PersonalCloudDrive") {
        $currentStorage = "D:\PersonalCloudDrive"
    } elseif (Test-Path "E:\PersonalCloudDrive") {
        $currentStorage = "E:\PersonalCloudDrive"
    } else {
        $currentStorage = "D:\PersonalCloudDrive"
    }
}

Write-Host "  当前推荐/已设定的数据根目录: [$currentStorage]" -ForegroundColor Cyan
Write-Host "  提示: 如果你的新主机数据放在其他盘（如 E:\PersonalCloudDrive 或外接大硬盘），请输入新路径。" -ForegroundColor Gray
$userInputPath = Read-Host "  请输入数据目录路径 [直接按回车默认使用 $currentStorage]"
if ($userInputPath.Trim()) {
    $currentStorage = $userInputPath.Trim().Trim('"').Trim("'").TrimEnd('\', '/')
}

# 确保目录存在
if (-not (Test-Path -LiteralPath $currentStorage)) {
    Write-Host "  正在初始化创建数据目录: $currentStorage ..." -ForegroundColor Gray
    New-Item -ItemType Directory -Force -Path $currentStorage | Out-Null
}

# 写入/更新 .env 文件
if (Test-Path -LiteralPath $envFilePath) {
    $existingContent = Get-Content -LiteralPath $envFilePath -Raw -Encoding UTF8
    if ($existingContent -match "(?m)^\s*STORAGE_BASE_ROOT\s*=.*$") {
        $newContent = $existingContent -replace "(?m)^\s*STORAGE_BASE_ROOT\s*=.*$", "STORAGE_BASE_ROOT=$currentStorage"
    } else {
        $newContent = "STORAGE_BASE_ROOT=$currentStorage`r`n" + $existingContent
    }
    Set-Content -LiteralPath $envFilePath -Value $newContent -Encoding UTF8
} else {
    $exampleFile = Join-Path $root ".env.example"
    if (Test-Path -LiteralPath $exampleFile) {
        $exampleContent = Get-Content -LiteralPath $exampleFile -Raw -Encoding UTF8
        $newContent = $exampleContent -replace "(?m)^\s*STORAGE_BASE_ROOT\s*=.*$", "STORAGE_BASE_ROOT=$currentStorage"
        Set-Content -LiteralPath $envFilePath -Value $newContent -Encoding UTF8
    } else {
        $envContent = @"
# DPSir 个人网盘配置文件
STORAGE_BASE_ROOT=$currentStorage
PORT=8081
HOST=0.0.0.0
CLOUD_DRIVE_USER=admin
# CLOUD_DRIVE_PASSWORD=
# DEEPSEEK_API_KEY=
PUBLIC_ACCESS_URL=
"@
        Set-Content -LiteralPath $envFilePath -Value $envContent -Encoding UTF8
    }
}
Write-Host "  ✓ 存储配置已锁定: $currentStorage" -ForegroundColor Green

# 3. 检查依赖项 (node_modules)
Write-Host ""
Write-Host "[3/5] 正在检查程序运行依赖..." -ForegroundColor Green
$modulesPath = Join-Path $root "node_modules"
if (-not (Test-Path -LiteralPath $modulesPath)) {
    Write-Host "  正在一键安装必需依赖包 (npm install)..." -ForegroundColor Yellow
    npm install
}
Write-Host "  ✓ 运行依赖已完整就绪" -ForegroundColor Green

# 4. 配置 Windows 防火墙（放行 8081 局域网访问）
Write-Host ""
Write-Host "[4/5] 正在配置 Windows 防火墙规则..." -ForegroundColor Green
try {
    $rule = Get-NetFirewallRule -Name "DPSir-CloudDrive-LAN" -ErrorAction SilentlyContinue
    if (-not $rule) {
        New-NetFirewallRule `
            -Name "DPSir-CloudDrive-LAN" `
            -DisplayName "DPSir 个人网盘 (8081 局域网放行)" `
            -Direction Inbound `
            -Action Allow `
            -Protocol TCP `
            -LocalPort 8081 `
            -Profile Any `
            -ErrorAction SilentlyContinue | Out-Null
        Write-Host "  ✓ 已成功创建防火墙入站放行规则 (TCP 8081)" -ForegroundColor Green
    } else {
        Write-Host "  ✓ 防火墙入站规则已存在 (TCP 8081)" -ForegroundColor Green
    }
} catch {
    Write-Host "  [提示] 自动添加防火墙规则跳过（非管理员权限），后续可右键以管理员身份运行 allow-lan-firewall-as-admin.bat" -ForegroundColor Yellow
}

# 5. 注册开机静默自启动计划任务
Write-Host ""
Write-Host "[5/5] 正在安装 Windows 开机后台自启动任务..." -ForegroundColor Green
try {
    $installScript = Join-Path $PSScriptRoot "install-lan-autostart.ps1"
    if (Test-Path -LiteralPath $installScript) {
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $installScript
    }
} catch {
    Write-Host "  [提示] 自动注册自启遇到限制，您可以随时手动双击 install-lan-autostart.bat" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "              🎉 恭喜！网盘服务已在新主机成功部署！            " -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

# 打印访问地址
$showScript = Join-Path $PSScriptRoot "show-addresses.ps1"
if (Test-Path -LiteralPath $showScript) {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $showScript
}

Write-Host "提示: 以后开机小主机会在后台自动守护运行，无需每次手动开启。" -ForegroundColor Gray
Write-Host "提示: 如需在浏览器中直接打开，请双击 [start-lan-drive.bat] 或访问上述地址。" -ForegroundColor Cyan
Write-Host ""
