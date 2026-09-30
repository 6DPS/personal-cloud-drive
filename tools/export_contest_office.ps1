$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$Out = Join-Path $Root "output\contest-submission"
$Temp = "C:\Temp\contest-export"
New-Item -ItemType Directory -Force $Temp | Out-Null

$PlanDocx = Join-Path $Out "智云引擎_AI创意赛道_商业计划书.docx"
$PlanPdf = Join-Path $Out "智云引擎_AI创意赛道_商业计划书.pdf"
$PlanTempDocx = Join-Path $Temp "plan.docx"
$PlanTempPdf = Join-Path $Temp "plan.pdf"
Copy-Item -LiteralPath $PlanDocx -Destination $PlanTempDocx -Force

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
  $doc = $word.Documents.Open($PlanTempDocx, $false, $true, $false)
  $doc.ExportAsFixedFormat($PlanTempPdf, 17)
  $doc.Close($false)
} finally {
  $word.Quit()
}
Copy-Item -LiteralPath $PlanTempPdf -Destination $PlanPdf -Force

$Pptx = Join-Path $Out "智云引擎_AI创意赛道_网评PPT.pptx"
$PptPdf = Join-Path $Out "智云引擎_AI创意赛道_网评PPT.pdf"
$PptTemp = Join-Path $Temp "review.pptx"
$PptTempPdf = Join-Path $Temp "review.pdf"
Copy-Item -LiteralPath $Pptx -Destination $PptTemp -Force

$powerpoint = New-Object -ComObject PowerPoint.Application
try {
  $presentation = $powerpoint.Presentations.Open($PptTemp, $true, $false, $false)
  $presentation.SaveAs($PptTempPdf, 32)
  $presentation.Close()
} finally {
  $powerpoint.Quit()
}
Copy-Item -LiteralPath $PptTempPdf -Destination $PptPdf -Force

Get-ChildItem -LiteralPath $Out -File | Select-Object Name,Length,LastWriteTime
