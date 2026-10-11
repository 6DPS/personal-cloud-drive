param(
  [Parameter(Mandatory = $true)][string]$InputPath,
  [Parameter(Mandatory = $true)][string]$OutputPath
)

$ErrorActionPreference = "Stop"

$inputFull = [System.IO.Path]::GetFullPath($InputPath)
$outputFull = [System.IO.Path]::GetFullPath($OutputPath)
$extension = [System.IO.Path]::GetExtension($inputFull).ToLowerInvariant()
$outputDir = [System.IO.Path]::GetDirectoryName($outputFull)

New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

function Close-ComObject($object) {
  if ($null -ne $object) {
    [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($object)
  }
}

if ($extension -in @(".doc", ".docx")) {
  $word = $null
  $document = $null
  try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $document = $word.Documents.Open($inputFull, $false, $true)
    $document.ExportAsFixedFormat($outputFull, 17)
  } finally {
    if ($document) { $document.Close($false) }
    if ($word) { $word.Quit() }
    Close-ComObject $document
    Close-ComObject $word
  }
} elseif ($extension -in @(".ppt", ".pptx")) {
  $powerPoint = $null
  $presentation = $null
  try {
    $powerPoint = New-Object -ComObject PowerPoint.Application
    $presentation = $powerPoint.Presentations.Open($inputFull, $true, $true, $false)
    $presentation.SaveAs($outputFull, 32)
  } finally {
    if ($presentation) { $presentation.Close() }
    if ($powerPoint) { $powerPoint.Quit() }
    Close-ComObject $presentation
    Close-ComObject $powerPoint
  }
} elseif ($extension -in @(".xls", ".xlsx", ".csv")) {
  $excel = $null
  $workbook = $null
  try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $workbook = $excel.Workbooks.Open($inputFull, 3, $true)
    $workbook.ExportAsFixedFormat(0, $outputFull)
  } finally {
    if ($workbook) { $workbook.Close($false) }
    if ($excel) { $excel.Quit() }
    Close-ComObject $workbook
    Close-ComObject $excel
  }
} else {
  throw "Unsupported Office file type: $extension"
}

if (-not (Test-Path -LiteralPath $outputFull)) {
  throw "Office preview was not generated."
}
