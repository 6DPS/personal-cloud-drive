# ==============================================================================
# DPSir 个人网盘 - Windows 小主机/新电脑 一键部署与迁移配置向导
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

# 1. 检查 Node.js 运行环境
Write-Host "[1/5] 正在检查 Node.js 运行环境..." -ForegroundColor Green
$commonNodeDirs = @(
    "C:\Program Files\nodejs",
    "C:\Program Files (x86)\nodejs",
    "$env:LOCALAPPDATA\Programs\nodejs",
    "$env:APPDATA\nvm"
)
foreach ($dir in $commonNodeDirs) {
    if ((Test-Path -LiteralPath (Join-Path $dir "node.exe")) -and ($env:Path -notlike "*$dir*")) {
        $env:Path = "$dir;" + $env:Path
    }
}

$nodeCmd = Get-Command "node" -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host "  未检测到 Node.js，正在尝试通过 Windows 自带的 winget 自动安装 LTS 版本..." -ForegroundColor Yellow
    $wingetCmd = Get-Command "winget" -ErrorAction SilentlyContinue
    if ($wingetCmd) {
        Write-Host "  正在执行: winget install OpenJS.NodeJS.LTS ..." -ForegroundColor Gray
        Start-Process "winget" -ArgumentList "install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements" -Wait
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        foreach ($dir in $commonNodeDirs) {
            if ((Test-Path -LiteralPath (Join-Path $dir "node.exe")) -and ($env:Path -notlike "*$dir*")) {
                $env:Path = "$dir;" + $env:Path
            }
        }
        $nodeCmd = Get-Command "node" -ErrorAction SilentlyContinue
    }
    
    if (-not $nodeCmd) {
        Write-Host "  [错误] 自动安装未能就绪，请手动下载安装 Node.js LTS 官方安装包:" -ForegroundColor Red
        Write-Host "  官方下载地址: https://nodejs.org/" -ForegroundColor Yellow
        Write-Host "  安装完成后重新双击运行本向导即可！" -ForegroundColor Yellow
        Read-Host "按回车键退出..."
        exit 1
    }
}
$nodeVersion = node -v
Write-Host "  [OK] Node.js 运行环境已就绪: $nodeVersion" -ForegroundColor Green

# 2. 检查并配置网盘数据存储路径 (STORAGE_BASE_ROOT)
Write-Host ""
Write-Host "[2/5] 正在配置网盘数据存储路径..." -ForegroundColor Green

$envFilePath = Join-Path $root ".env"
$currentStorage = ""
if (Test-Path -LiteralPath $envFilePath) {
    $lines = Get-Content -LiteralPath $envFilePath -Encoding UTF8
    foreach ($line in $lines) {
        if ($line -match "^\s*STORAGE_BASE_ROOT\s*=\s*(.+)$") {
            $candidateStorage = $matches[1].Trim('"', "'", " ")
            $driveRoot = Split-Path $candidateStorage -Qualifier
            if (-not $driveRoot -or (Test-Path -LiteralPath "$driveRoot\")) {
                $currentStorage = $candidateStorage
            } else {
                Write-Host "  [提示] 旧配置中的盘符 $driveRoot 在本台电脑上不存在，正在为您推荐可用盘符..." -ForegroundColor Yellow
            }
        }
    }
}

if (-not $currentStorage) {
    if (Test-Path -LiteralPath "D:\PersonalCloudDrive") {
        $currentStorage = "D:\PersonalCloudDrive"
    } elseif (Test-Path -LiteralPath "D:\") {
        $currentStorage = "D:\PersonalCloudDrive"
    } elseif (Test-Path -LiteralPath "E:\PersonalCloudDrive") {
        $currentStorage = "E:\PersonalCloudDrive"
    } elseif (Test-Path -LiteralPath "E:\") {
        $currentStorage = "E:\PersonalCloudDrive"
    } else {
        $currentStorage = "C:\PersonalCloudDrive"
    }
}

Write-Host "  当前推荐/已设定的数据根目录: [$currentStorage]" -ForegroundColor Cyan
Write-Host "  提示: 如果你的新主机数据放在其他盘（如 E:\PersonalCloudDrive 或外接移动硬盘），请输入新路径。" -ForegroundColor Gray
$userInputPath = Read-Host "  请输入数据目录路径 [直接按回车默认使用 $currentStorage]"
if ($userInputPath.Trim()) {
    $candidateInput = $userInputPath.Trim().Trim('"').Trim("'").TrimEnd('\', '/')
    $candidateDrive = Split-Path $candidateInput -Qualifier
    if ($candidateDrive -and (-not (Test-Path -LiteralPath "$candidateDrive\"))) {
        Write-Host "  [警告] 盘符 $candidateDrive 在此电脑不存在，回退使用推荐路径: $currentStorage" -ForegroundColor Red
    } else {
        $currentStorage = $candidateInput
    }
}

# 确保目录存在
if (-not (Test-Path -LiteralPath $currentStorage)) {
    Write-Host "  正在初始化创建数据目录: $currentStorage ..." -ForegroundColor Gray
    New-Item -ItemType Directory -Force -Path $currentStorage | Out-Null
}

$accountsFile = Join-Path $currentStorage "accounts.json"
if (Test-Path -LiteralPath $accountsFile) {
    Write-Host "  [OK] 检测到已迁移的历史账号数据 (accounts.json)，系统已自动继承所有账号与配额！" -ForegroundColor Green
} else {
    Write-Host "  [提示] 当前目录暂无历史 accounts.json，系统将在启动时自动初始化默认管理员账户。" -ForegroundColor Gray
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
Write-Host "  [OK] 存储配置已锁定: $currentStorage" -ForegroundColor Green

# 3. 检查程序运行依赖 (node_modules)
Write-Host ""
Write-Host "[3/5] 正在检查程序运行依赖..." -ForegroundColor Green
$modulesPath = Join-Path $root "node_modules"
if (-not (Test-Path -LiteralPath $modulesPath)) {
    Write-Host "  正在一键安装必需依赖包 (npm install)..." -ForegroundColor Yellow
    npm install
}
Write-Host "  [OK] 运行依赖已完整就绪" -ForegroundColor Green

# 4. 配置 Windows 防火墙（TCP 8081 全网络放行，公用+专用+域网络）
Write-Host ""
Write-Host "[4/5] 正在配置 Windows 防火墙全网络放行规则..." -ForegroundColor Green
try {
    $allowScript = Join-Path $PSScriptRoot "allow-lan-firewall.ps1"
    if (Test-Path -LiteralPath $allowScript) {
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $allowScript -NoPause
    } else {
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
        } else {
            Set-NetFirewallRule -InputObject $rule -Enabled True -Direction Inbound -Action Allow -Profile Any -ErrorAction SilentlyContinue
        }
        Write-Host "  [OK] 已成功创建/刷新防火墙入站放行规则 (TCP 8081, 所有网络通用)" -ForegroundColor Green
    }
} catch {
    Write-Host "  [提示] 自动添加防火墙规则跳过（需管理员权限），后续可随时运行 allow-lan-firewall-as-admin.bat" -ForegroundColor Yellow
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

# 6. 验证服务启动状态（确保新用户部署后立马可用）
Write-Host ""
Write-Host "正在唤醒并验证网盘核心服务就绪状态..." -ForegroundColor Cyan
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

$serviceReady = $false
$lanTask = Get-ScheduledTask -TaskName "DPSir Personal Cloud Drive LAN" -ErrorAction SilentlyContinue
if ($lanTask) {
    Start-ScheduledTask -TaskName "DPSir Personal Cloud Drive LAN" -ErrorAction SilentlyContinue
} else {
    $runScript = Join-Path $PSScriptRoot "run-lan-drive-hidden.ps1"
    if (Test-Path -LiteralPath $runScript) {
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $runScript
    }
}
for ($i = 0; $i -lt 8; $i++) {
    try {
        $res = Invoke-RestMethod -Uri "http://127.0.0.1:8081/api/me" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($null -ne $res) {
            $serviceReady = $true
            break
        }
    } catch {}
    Start-Sleep -Seconds 1
}

if ($serviceReady) {
    Write-Host "  [OK] 网盘核心服务已成功就绪并正常监听 8081 端口！" -ForegroundColor Green
} else {
    Write-Host "  [提示] 后台服务正在启动中，可随时双击 start-lan-drive.bat 查看控制台输出。" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "              🎉 恭喜！网盘服务已在您的电脑成功就绪！          " -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Cyan

# 打印访问地址
$showScript = Join-Path $PSScriptRoot "show-addresses.ps1"
if (Test-Path -LiteralPath $showScript) {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $showScript -NoPause
}

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "  - 浏览器访问地址: http://127.0.0.1:8081" -ForegroundColor Yellow
Write-Host "  - 超级管理员账号: admin" -ForegroundColor Yellow
Write-Host "  - 超级管理员密码: admin123456 (或在 .env 中自定义的密码)" -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "提示: 以后开机小主机会在后台自动守护运行，无需每次手动开启。" -ForegroundColor Gray
Write-Host "正在为您在默认浏览器中自动打开网盘登录页..." -ForegroundColor Green
try {
    Start-Process "http://127.0.0.1:8081"
} catch {}
Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "  🎉 向导全部执行完毕！服务已在后台健康运行。" -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "按回车键退出向导..."
exit 0
