# ==============================================================================
# DPSir Personal Cloud Drive - Windows Setup & Migration Wizard
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = "Continue"

$root = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $root

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "     DPSir Personal Cloud Drive - Windows Setup Wizard         " -ForegroundColor Yellow
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
    # Check if an offline installer exists in root or tools directory
    $localMsi = Get-ChildItem -Path $root, (Join-Path $root "tools") -Filter "node*x64.msi" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($localMsi) {
        Write-Host "  [OFFLINE] Found local installer: $($localMsi.Name). Installing..." -ForegroundColor Green
        Start-Process "msiexec.exe" -ArgumentList "/i `"$($localMsi.FullName)`" /passive /norestart" -Wait
    } else {
        Write-Host "  Node.js not found. Downloading official LTS installer from mirror..." -ForegroundColor Cyan
        $msiPath = Join-Path $env:TEMP "node-v20.18.0-x64.msi"
        $mirrors = @(
            "https://mirrors.huaweicloud.com/nodejs/v20.18.0/node-v20.18.0-x64.msi",
            "https://npmmirror.com/mirrors/node/v20.18.0/node-v20.18.0-x64.msi"
        )
        $dlSuccess = $false
        foreach ($url in $mirrors) {
            try {
                Write-Host "  Downloading: $url ..." -ForegroundColor Gray
                $wc = New-Object System.Net.WebClient
                $wc.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                $wc.DownloadFile($url, $msiPath)
                if ((Test-Path -LiteralPath $msiPath) -and (Get-Item -LiteralPath $msiPath).Length -gt 15MB) {
                    $dlSuccess = $true
                    break
                }
            } catch {}
        }

        if ($dlSuccess) {
            Write-Host "  [OK] Download complete. Running silent installation (approx. 10 seconds)..." -ForegroundColor Green
            Start-Process "msiexec.exe" -ArgumentList "/i `"$msiPath`" /passive /norestart" -Wait
            Remove-Item -LiteralPath $msiPath -Force -ErrorAction SilentlyContinue
        } else {
            $wingetCmd = Get-Command "winget" -ErrorAction SilentlyContinue
            if ($wingetCmd) {
                Write-Host "  Attempting installation via Windows winget..." -ForegroundColor Gray
                Start-Process "winget" -ArgumentList "install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements" -Wait
            }
        }
    }
    
    # Reload environment PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    foreach ($dir in $commonNodeDirs) {
        if ((Test-Path -LiteralPath (Join-Path $dir "node.exe")) -and ($env:Path -notlike "*$dir*")) {
            $env:Path = "$dir;" + $env:Path
        }
    }
    $nodeCmd = Get-Command "node" -ErrorAction SilentlyContinue
    
    if (-not $nodeCmd) {
        Write-Host ""
        Write-Host "  [WARN] Automatic download did not complete. Please download Node.js from one of these links:" -ForegroundColor Yellow
        Write-Host "  -> Mirror 1 (Huawei Cloud): https://mirrors.huaweicloud.com/nodejs/v20.18.0/node-v20.18.0-x64.msi" -ForegroundColor Cyan
        Write-Host "  -> Mirror 2 (npmmirror)   : https://npmmirror.com/mirrors/node/v20.18.0/node-v20.18.0-x64.msi" -ForegroundColor Cyan
        Write-Host "  -> Official Site          : https://nodejs.org/" -ForegroundColor Gray
        Write-Host "  After installing Node.js, re-run setup-new-host.bat." -ForegroundColor Yellow
        Write-Host ""
        Read-Host "Press Enter to exit..."
        exit 1
    }
}
$nodeVersion = node -v
Write-Host "  [OK] Node.js runtime is ready: $nodeVersion" -ForegroundColor Green

# 2. Check and configure data storage path (STORAGE_BASE_ROOT)
Write-Host ""
Write-Host "[2/5] Configuring cloud drive data storage path..." -ForegroundColor Green

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
                Write-Host "  [INFO] Drive $driveRoot from previous config does not exist on this PC. Selecting available drive..." -ForegroundColor Yellow
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

Write-Host "  Recommended / current data root directory: [$currentStorage]" -ForegroundColor Cyan
Write-Host "  Tip: If your data is on another drive (e.g. E:\PersonalCloudDrive), enter the custom path below." -ForegroundColor Gray
$userInputPath = Read-Host "  Enter data directory path [Press Enter for default: $currentStorage]"
if ($userInputPath.Trim()) {
    $candidateInput = $userInputPath.Trim().Trim('"').Trim("'").TrimEnd('\', '/')
    $candidateDrive = Split-Path $candidateInput -Qualifier
    if ($candidateDrive -and (-not (Test-Path -LiteralPath "$candidateDrive\"))) {
        Write-Host "  [WARN] Drive $candidateDrive does not exist on this PC. Using default path: $currentStorage" -ForegroundColor Red
    } else {
        $currentStorage = $candidateInput
    }
}

# Ensure directory exists
if (-not (Test-Path -LiteralPath $currentStorage)) {
    Write-Host "  Creating data directory: $currentStorage ..." -ForegroundColor Gray
    New-Item -ItemType Directory -Force -Path $currentStorage | Out-Null
}

$accountsFile = Join-Path $currentStorage "accounts.json"
if (Test-Path -LiteralPath $accountsFile) {
    Write-Host "  [OK] Existing migrated account data (accounts.json) detected! All accounts and quotas preserved." -ForegroundColor Green
} else {
    Write-Host "  [INFO] No existing accounts.json found. Default admin account will be initialized on startup." -ForegroundColor Gray
}

# Write or update .env file
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
        $envLines = @(
            "# DPSir Personal Cloud Drive Configuration",
            "STORAGE_BASE_ROOT=$currentStorage",
            "PORT=8081",
            "HOST=0.0.0.0",
            "CLOUD_DRIVE_USER=admin",
            "# CLOUD_DRIVE_PASSWORD=",
            "# DEEPSEEK_API_KEY=",
            "PUBLIC_ACCESS_URL="
        )
        Set-Content -LiteralPath $envFilePath -Value $envLines -Encoding UTF8
    }
}
Write-Host "  [OK] Storage path locked: $currentStorage" -ForegroundColor Green

# 3. Check application dependencies (node_modules) & Git domestic mirror binding
Write-Host ""
Write-Host "[3/5] Checking application dependencies & cloud sync channel..." -ForegroundColor Green
if (Get-Command git -ErrorAction SilentlyContinue) {
    if (-not (Test-Path -LiteralPath (Join-Path $root ".git"))) {
        git init 2>$null | Out-Null
    }
    $originUrl = git remote get-url origin 2>$null
    if (-not $originUrl) {
        git remote add origin "https://github.com/6DPS/personal-cloud-drive.git" 2>$null
    }
    git rev-parse --verify HEAD 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Binding GitHub domestic mirror channel for future one-click updates..." -ForegroundColor Cyan
        $setupMirrors = @(
            "https://gh-proxy.com/https://github.com/6DPS/personal-cloud-drive.git",
            "https://ghfast.top/https://github.com/6DPS/personal-cloud-drive.git",
            "https://ghproxy.net/https://github.com/6DPS/personal-cloud-drive.git",
            "https://gh.llkk.cc/https://github.com/6DPS/personal-cloud-drive.git"
        )
        foreach ($ep in $setupMirrors) {
            git -c http.sslVerify=false -c http.connectTimeout=5 -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=15 fetch --depth=1 --progress $ep main
            if ($LASTEXITCODE -eq 0) {
                git checkout -f -B main FETCH_HEAD 2>$null | Out-Null
                git reset --hard FETCH_HEAD 2>$null | Out-Null
                git update-ref refs/remotes/origin/main FETCH_HEAD 2>$null
                git branch --set-upstream-to=origin/main main 2>$null | Out-Null
                git config --local dpsir.fastMirror "$ep" 2>$null
                break
            }
        }
    }
}
& npm config set registry https://registry.npmmirror.com 2>$null
$modulesPath = Join-Path $root "node_modules"
if (-not (Test-Path -LiteralPath $modulesPath)) {
    Write-Host "  Installing required packages via domestic mirror (npmmirror.com)..." -ForegroundColor Yellow
    npm install --omit=dev
}
Write-Host "  [OK] Application dependencies are ready." -ForegroundColor Green

# 4. Configure Windows Firewall (TCP 8081 across Public/Private/Domain profiles)
Write-Host ""
Write-Host "[4/5] Configuring Windows Firewall rules (TCP 8081)..." -ForegroundColor Green
try {
    $allowScript = Join-Path $PSScriptRoot "allow-lan-firewall.ps1"
    if (Test-Path -LiteralPath $allowScript) {
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $allowScript -NoPause
    } else {
        $rule = Get-NetFirewallRule -Name "DPSir-CloudDrive-LAN" -ErrorAction SilentlyContinue
        if (-not $rule) {
            New-NetFirewallRule `
                -Name "DPSir-CloudDrive-LAN" `
                -DisplayName "DPSir Personal Cloud Drive (LAN TCP 8081)" `
                -Direction Inbound `
                -Action Allow `
                -Protocol TCP `
                -LocalPort 8081 `
                -Profile Any `
                -ErrorAction SilentlyContinue | Out-Null
        } else {
            Set-NetFirewallRule -InputObject $rule -Enabled True -Direction Inbound -Action Allow -Profile Any -ErrorAction SilentlyContinue
        }
        Write-Host "  [OK] Created/updated inbound firewall rule (TCP 8081, All Profiles)" -ForegroundColor Green
    }
} catch {
    Write-Host "  [INFO] Firewall configuration skipped (requires Admin). You can run allow-lan-firewall-as-admin.bat anytime." -ForegroundColor Yellow
}

# 5. Register background auto-start task
Write-Host ""
Write-Host "[5/5] Installing Windows background auto-start task..." -ForegroundColor Green
try {
    $installScript = Join-Path $PSScriptRoot "install-lan-autostart.ps1"
    if (Test-Path -LiteralPath $installScript) {
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $installScript
    }
} catch {
    Write-Host "  [INFO] Auto-start task registration skipped. You can run install-lan-autostart.bat anytime." -ForegroundColor Yellow
}

# 6. Verify service startup status
Write-Host ""
Write-Host "Starting and verifying cloud drive core service..." -ForegroundColor Cyan
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
    Write-Host "  [OK] Cloud drive core service is online and listening on port 8081!" -ForegroundColor Green
} else {
    Write-Host "  [INFO] Background service is starting. You can run start-lan-drive.bat to view console logs." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "     [OK] DPSir Personal Cloud Drive is Ready on Windows!      " -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Cyan

# Print access addresses
$showScript = Join-Path $PSScriptRoot "show-addresses.ps1"
if (Test-Path -LiteralPath $showScript) {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $showScript -NoPause
}

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "  - Browser URL    : http://127.0.0.1:8081" -ForegroundColor Yellow
Write-Host "  - Admin Username : admin" -ForegroundColor Yellow
Write-Host "  - Admin Password : admin123456 (or custom password in .env)" -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: The service runs automatically in the background on Windows startup." -ForegroundColor Gray
Write-Host "Opening cloud drive login page in your default browser..." -ForegroundColor Green
try {
    Start-Process "http://127.0.0.1:8081"
} catch {}
Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "  [OK] Setup wizard completed! Service is running in background." -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit wizard..."
exit 0
