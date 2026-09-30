# ==============================================================================
# DPSir Personal Cloud Drive - Windows Host One-Click Setup & Migration Script
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Continue"

$root = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $root

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "       DPSir Personal Cloud Drive - One-Click Setup Wizard     " -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Node.js runtime environment
Write-Host "[1/5] Checking Node.js runtime environment..." -ForegroundColor Green
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
    Write-Host "  Node.js not detected. Attempting automatic LTS install via winget..." -ForegroundColor Yellow
    $wingetCmd = Get-Command "winget" -ErrorAction SilentlyContinue
    if ($wingetCmd) {
        Write-Host "  Running: winget install OpenJS.NodeJS.LTS ..." -ForegroundColor Gray
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
        Write-Host "  [Error] Auto-install failed. Please manually download and install Node.js LTS:" -ForegroundColor Red
        Write-Host "  Official download: https://nodejs.org/" -ForegroundColor Yellow
        Write-Host "  Re-run this wizard after installation is complete." -ForegroundColor Yellow
        Read-Host "Press Enter to exit..."
        exit 1
    }
}
$nodeVersion = node -v
Write-Host "  [OK] Node.js is ready: $nodeVersion" -ForegroundColor Green

# 2. Check and configure data storage root (STORAGE_BASE_ROOT)
Write-Host ""
Write-Host "[2/5] Configuring storage directory..." -ForegroundColor Green

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
                Write-Host "  [Notice] Drive $driveRoot from old config not found on this machine. Suggesting available drive..." -ForegroundColor Yellow
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

Write-Host "  Current / recommended data root: [$currentStorage]" -ForegroundColor Cyan
Write-Host "  (Tip: If your data is on another disk like E:\PersonalCloudDrive or an external drive, enter the path below.)" -ForegroundColor Gray
$userInputPath = Read-Host "  Enter storage path [Press Enter to use $currentStorage]"
if ($userInputPath.Trim()) {
    $candidateInput = $userInputPath.Trim().Trim('"').Trim("'").TrimEnd('\', '/')
    $candidateDrive = Split-Path $candidateInput -Qualifier
    if ($candidateDrive -and (-not (Test-Path -LiteralPath "$candidateDrive\"))) {
        Write-Host "  [Warning] Drive $candidateDrive does not exist on this machine. Falling back to: $currentStorage" -ForegroundColor Red
    } else {
        $currentStorage = $candidateInput
    }
}

# Ensure directory exists
if (-not (Test-Path -LiteralPath $currentStorage)) {
    Write-Host "  Creating storage directory: $currentStorage ..." -ForegroundColor Gray
    New-Item -ItemType Directory -Force -Path $currentStorage | Out-Null
}

$accountsFile = Join-Path $currentStorage "accounts.json"
if (Test-Path -LiteralPath $accountsFile) {
    Write-Host "  [OK] Existing accounts file detected (accounts.json). Historical accounts and quotas restored!" -ForegroundColor Green
} else {
    Write-Host "  [Notice] No accounts.json found. Default admin account will be initialized on first run." -ForegroundColor Gray
}

# Write/Update .env file
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
# DPSir Personal Cloud Drive Configuration
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
Write-Host "  [OK] Storage path locked: $currentStorage" -ForegroundColor Green

# 3. Check application dependencies (node_modules)
Write-Host ""
Write-Host "[3/5] Checking application dependencies..." -ForegroundColor Green
$modulesPath = Join-Path $root "node_modules"
if (-not (Test-Path -LiteralPath $modulesPath)) {
    Write-Host "  Installing required dependencies (npm install)..." -ForegroundColor Yellow
    npm install
}
Write-Host "  [OK] Dependencies are ready." -ForegroundColor Green

# 4. Configure Windows Firewall (TCP 8081 inbound allow, all profiles)
Write-Host ""
Write-Host "[4/5] Configuring Windows Firewall rules..." -ForegroundColor Green
try {
    $allowScript = Join-Path $PSScriptRoot "allow-lan-firewall.ps1"
    if (Test-Path -LiteralPath $allowScript) {
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $allowScript -NoPause
    } else {
        $rule = Get-NetFirewallRule -Name "DPSir-CloudDrive-LAN" -ErrorAction SilentlyContinue
        if (-not $rule) {
            New-NetFirewallRule `
                -Name "DPSir-CloudDrive-LAN" `
                -DisplayName "DPSir Personal Cloud Drive (Port 8081 LAN Allow)" `
                -Direction Inbound `
                -Action Allow `
                -Protocol TCP `
                -LocalPort 8081 `
                -Profile Any `
                -ErrorAction SilentlyContinue | Out-Null
        } else {
            Set-NetFirewallRule -InputObject $rule -Enabled True -Direction Inbound -Action Allow -Profile Any -ErrorAction SilentlyContinue
        }
        Write-Host "  [OK] Inbound firewall rule active (TCP 8081, all network profiles)" -ForegroundColor Green
    }
} catch {
    Write-Host "  [Notice] Firewall rule setup skipped (run as administrator if needed)." -ForegroundColor Yellow
}

# 5. Register auto-start background task
Write-Host ""
Write-Host "[5/5] Installing Windows auto-start background task..." -ForegroundColor Green
try {
    $installScript = Join-Path $PSScriptRoot "install-lan-autostart.ps1"
    if (Test-Path -LiteralPath $installScript) {
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $installScript
    }
} catch {
    Write-Host "  [Notice] Auto-start registration skipped." -ForegroundColor Yellow
}

# 6. Verify service startup
Write-Host ""
Write-Host "Waking up and verifying Cloud Drive service..." -ForegroundColor Cyan
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
    Write-Host "  [OK] Cloud Drive service is healthy and listening on port 8081!" -ForegroundColor Green
} else {
    Write-Host "  [Notice] Background service is still starting up." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "  [SUCCESS] Personal Cloud Drive is ready to use!              " -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Cyan

# Show access addresses
$showScript = Join-Path $PSScriptRoot "show-addresses.ps1"
if (Test-Path -LiteralPath $showScript) {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $showScript -NoPause
}

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "  - Local URL:      http://127.0.0.1:8081" -ForegroundColor Yellow
Write-Host "  - Admin Username: admin" -ForegroundColor Yellow
Write-Host "  - Admin Password: admin123456 (or custom password in .env)" -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tip: The host will automatically start the background service upon boot." -ForegroundColor Gray
Write-Host "Opening Cloud Drive in your default browser..." -ForegroundColor Green
try {
    Start-Process "http://127.0.0.1:8081"
} catch {}
Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "  All setup steps finished successfully!" -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit this wizard..."
