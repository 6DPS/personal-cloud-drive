$ErrorActionPreference = "Stop"

$storageRoot = if ($env:STORAGE_ROOT) { $env:STORAGE_ROOT } else { "D:\PersonalCloudDrive\files" }
$storageRoot = [System.IO.Path]::GetFullPath($storageRoot)

if (-not (Test-Path -LiteralPath $storageRoot)) {
  throw "Storage root does not exist: $storageRoot"
}

$files = Get-ChildItem -LiteralPath $storageRoot -Recurse -File -Force |
  Where-Object {
    $_.Name -like "~$*" -or
    $_.Name -like "*.tmp" -or
    $_.Name -like "*.temp" -or
    $_.Name -in @("Thumbs.db", "desktop.ini", ".DS_Store")
  }

if (-not $files) {
  Write-Host "No hidden temporary files found."
  exit 0
}

Write-Host "Removing hidden temporary files:"
foreach ($file in $files) {
  Write-Host "  $($file.FullName)"
  Remove-Item -LiteralPath $file.FullName -Force
}

Write-Host "Done. Removed $($files.Count) file(s)."
