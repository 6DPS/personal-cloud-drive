param(
  [Parameter(Mandatory = $true)][ValidateSet("word", "powerpoint", "excel")][string]$Kind
)

$ErrorActionPreference = "Stop"

function Write-JsonLine($value) {
  $json = $value | ConvertTo-Json -Compress -Depth 6
  [Console]::Out.WriteLine($json)
  [Console]::Out.Flush()
}

function Close-ComObject($object) {
  if ($null -ne $object) {
    [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($object)
  }
}

$application = $null

try {
  if ($Kind -eq "word") {
    $application = New-Object -ComObject Word.Application
    $application.Visible = $false
    $application.DisplayAlerts = 0
  } elseif ($Kind -eq "powerpoint") {
    $application = New-Object -ComObject PowerPoint.Application
  } elseif ($Kind -eq "excel") {
    $application = New-Object -ComObject Excel.Application
    $application.Visible = $false
    $application.DisplayAlerts = $false
  }

  Write-JsonLine @{ status = "ready"; kind = $Kind }

  while ($true) {
    $line = [Console]::In.ReadLine()
    if ($null -eq $line) { break }
    if ([string]::IsNullOrWhiteSpace($line)) { continue }

    $request = $line | ConvertFrom-Json
    if ($request.command -eq "exit") { break }

    $inputFull = [System.IO.Path]::GetFullPath([string]$request.inputPath)
    $outputFull = [System.IO.Path]::GetFullPath([string]$request.outputPath)
    $outputDir = [System.IO.Path]::GetDirectoryName($outputFull)
    New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

    $document = $null
    $presentation = $null
    $workbook = $null

    try {
      if ($Kind -eq "word") {
        $document = $application.Documents.Open($inputFull, $false, $true)
        $document.ExportAsFixedFormat($outputFull, 17)
      } elseif ($Kind -eq "powerpoint") {
        $presentation = $application.Presentations.Open($inputFull, $true, $true, $false)
        $presentation.SaveAs($outputFull, 32)
      } elseif ($Kind -eq "excel") {
        $workbook = $application.Workbooks.Open($inputFull, 3, $true)
        $workbook.ExportAsFixedFormat(0, $outputFull)
      }

      if (-not (Test-Path -LiteralPath $outputFull)) {
        throw "Office preview was not generated."
      }

      Write-JsonLine @{ status = "ok"; outputPath = $outputFull }
    } catch {
      Write-JsonLine @{ status = "error"; error = $_.Exception.Message }
    } finally {
      if ($document) { $document.Close($false) }
      if ($presentation) { $presentation.Close() }
      if ($workbook) { $workbook.Close($false) }
      Close-ComObject $document
      Close-ComObject $presentation
      Close-ComObject $workbook
    }
  }
} catch {
  Write-JsonLine @{ status = "error"; error = $_.Exception.Message }
  exit 1
} finally {
  if ($application) {
    if ($Kind -eq "word" -or $Kind -eq "powerpoint") {
      $application.Quit()
    } elseif ($Kind -eq "excel") {
      $application.Quit()
    }
  }
  Close-ComObject $application
}
