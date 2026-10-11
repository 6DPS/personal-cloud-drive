# ==============================================================================
# DPSir Personal Cloud Drive - Migration & Storage Inspection Helper
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$root = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $root

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "     DPSir Personal Cloud Drive - Migration & Backup Helper    " -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Detect current data storage directory
$storageDir = "D:\PersonalCloudDrive"
$envFile = Join-Path $root ".env"
if (Test-Path -LiteralPath $envFile) {
    foreach ($line in (Get-Content -LiteralPath $envFile -Encoding UTF8)) {
        if ($line -match "^\s*STORAGE_BASE_ROOT\s*=\s*(.+)$") {
            $storageDir = $matches[1].Trim('"', "'", " ")
        }
    }
}

Write-Host "[1. Checking Migration Data Sources]" -ForegroundColor Green
Write-Host "  Application Directory : $root" -ForegroundColor Gray
Write-Host "  Data Storage Directory: $storageDir" -ForegroundColor Gray

if (Test-Path -LiteralPath $storageDir) {
    Write-Host "  Calculating data storage size, please wait..." -ForegroundColor Gray
    $items = Get-ChildItem -LiteralPath $storageDir -Recurse -File -ErrorAction SilentlyContinue
    $totalBytes = ($items | Measure-Object -Property Length -Sum).Sum
    $totalGB = [math]::Round($totalBytes / 1GB, 2)
    $totalCount = $items.Count
    Write-Host "  [OK] Data root directory exists!" -ForegroundColor Green
    Write-Host "    - Total Files: $totalCount" -ForegroundColor Cyan
    Write-Host "    - Disk Usage : $totalGB GB" -ForegroundColor Cyan
} else {
    Write-Host "  [WARN] Data directory not found at $storageDir. Please verify the path." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[2. Two-Step Host Migration Guide]" -ForegroundColor Green
Write-Host "  Simply copy the following two folders to your external drive / USB drive:" -ForegroundColor Yellow
Write-Host "  (1) Code Folder: $root" -ForegroundColor White
Write-Host "  (2) Data Folder: $storageDir" -ForegroundColor White
Write-Host ""
Write-Host "  After copying:" -ForegroundColor Gray
Write-Host "  Plug the external drive into the new computer:" -ForegroundColor Cyan
Write-Host "  - On Windows: Double-click setup-new-host.bat (or the Windows setup .bat script)" -ForegroundColor Cyan
Write-Host "  - On macOS  : Double-click the Mac setup .command script (or run scripts/setup-mac.sh)" -ForegroundColor Cyan
Write-Host ""

$open = Read-Host "Open both folders in File Explorer now? (Y/N) [Default: Y]"
if ($open -eq "" -or $open -eq "Y" -or $open -eq "y") {
    Start-Process "explorer.exe" -ArgumentList "`"$root`""
    if (Test-Path -LiteralPath $storageDir) {
        Start-Process "explorer.exe" -ArgumentList "`"$storageDir`""
    }
}

Write-Host ""
Write-Host "Migration helper finished. Ready to copy files." -ForegroundColor Green
Write-Host ""
