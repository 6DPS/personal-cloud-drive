# ==============================================================================
# DPSir 个人网盘 - 迁移准备与数据盘检查助手
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$root = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $root

Write-Host ""
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host "         DPSir 个人网盘 - 换机迁移与数据打包助手               " -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor Cyan
Write-Host ""

# 1. 探测当前数据目录
$storageDir = "D:\PersonalCloudDrive"
$envFile = Join-Path $root ".env"
if (Test-Path -LiteralPath $envFile) {
    foreach ($line in (Get-Content -LiteralPath $envFile -Encoding UTF8)) {
        if ($line -match "^\s*STORAGE_BASE_ROOT\s*=\s*(.+)$") {
            $storageDir = $matches[1].Trim('"', "'", " ")
        }
    }
}

Write-Host "【1. 检查迁移数据源】" -ForegroundColor Green
Write-Host "  程序代码目录: $root" -ForegroundColor Gray
Write-Host "  数据存放目录: $storageDir" -ForegroundColor Gray

if (Test-Path -LiteralPath $storageDir) {
    Write-Host "  正在统计数据目录大小，请稍候..." -ForegroundColor Gray
    $items = Get-ChildItem -LiteralPath $storageDir -Recurse -File -ErrorAction SilentlyContinue
    $totalBytes = ($items | Measure-Object -Property Length -Sum).Sum
    $totalGB = [math]::Round($totalBytes / 1GB, 2)
    $totalCount = $items.Count
    Write-Host "  ✓ 数据根目录正常存在！" -ForegroundColor Green
    Write-Host "    - 文件总数量: $totalCount 个" -ForegroundColor Cyan
    Write-Host "    - 占用磁盘空间: $totalGB GB" -ForegroundColor Cyan
} else {
    Write-Host "  [警告] 未在 $storageDir 找到数据目录，请检查路径是否正确。" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "【2. 换机迁移极简两步法】" -ForegroundColor Green
Write-Host "  只需将以下两个文件夹拷贝到你的移动硬盘 / U 盘中：" -ForegroundColor Yellow
Write-Host "  ① 代码文件夹: $root" -ForegroundColor White
Write-Host "  ② 数据文件夹: $storageDir" -ForegroundColor White
Write-Host ""
Write-Host "  拷贝完成后：" -ForegroundColor Gray
Write-Host "  在新主机/新电脑上插上移动硬盘：" -ForegroundColor Cyan
Write-Host "  • 若新电脑是 Windows 系统：双击代码文件夹里的【一键部署新电脑(Windows).bat】" -ForegroundColor Cyan
Write-Host "  • 若新电脑是 苹果 Mac 系统：双击代码文件夹里的【一键部署新电脑(Mac).command】" -ForegroundColor Cyan
Write-Host ""

$open = Read-Host "是否现在为你自动打开这两个文件夹所在的资源管理器窗口？(Y/N) [默认 Y]"
if ($open -eq "" -or $open -eq "Y" -or $open -eq "y") {
    Start-Process "explorer.exe" -ArgumentList "`"$root`""
    if (Test-Path -LiteralPath $storageDir) {
        Start-Process "explorer.exe" -ArgumentList "`"$storageDir`""
    }
}

Write-Host ""
Write-Host "助手已就绪，随时可以开始拷贝迁移。" -ForegroundColor Green
Write-Host ""
