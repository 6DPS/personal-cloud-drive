Option Explicit

Dim fso, root, outDir, tempDir
Set fso = CreateObject("Scripting.FileSystemObject")
root = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))
outDir = fso.BuildPath(root, "output\contest-submission")
tempDir = "C:\Temp\contest-export"
If Not fso.FolderExists(tempDir) Then fso.CreateFolder(tempDir)

Dim planDocx, pptx
planDocx = FindNewest(outDir, ".docx", "PPT")
pptx = FindNewest(outDir, ".pptx", "")
If planDocx = "" Then Err.Raise 1001, , "Plan DOCX not found."
If pptx = "" Then Err.Raise 1002, , "PPTX not found."

Dim planTempDocx, planTempPdf, pptTemp, pptTempPdf
planTempDocx = fso.BuildPath(tempDir, "plan-vbs.docx")
planTempPdf = fso.BuildPath(tempDir, "plan-vbs.pdf")
pptTemp = fso.BuildPath(tempDir, "review-vbs.pptx")
pptTempPdf = fso.BuildPath(tempDir, "review-vbs.pdf")

fso.CopyFile planDocx, planTempDocx, True
If fso.FileExists(planTempPdf) Then fso.DeleteFile planTempPdf, True

Dim word, doc
Set word = CreateObject("Word.Application")
word.Visible = False
word.DisplayAlerts = 0
Set doc = word.Documents.Open(planTempDocx, False, False, False)
doc.Fields.Update
If doc.TablesOfContents.Count > 0 Then
  doc.TablesOfContents(1).Update
End If
doc.Save
doc.SaveAs2 planTempPdf, 17
doc.Close False
word.Quit
Set doc = Nothing
Set word = Nothing
fso.CopyFile planTempDocx, planDocx, True
fso.CopyFile planTempPdf, ReplaceExtension(planDocx, ".pdf"), True

fso.CopyFile pptx, pptTemp, True
If fso.FileExists(pptTempPdf) Then fso.DeleteFile pptTempPdf, True

Dim powerpoint, presentation
Set powerpoint = CreateObject("PowerPoint.Application")
Set presentation = powerpoint.Presentations.Open(pptTemp, True, False, False)
presentation.SaveAs pptTempPdf, 32
presentation.Close
powerpoint.Quit
Set presentation = Nothing
Set powerpoint = Nothing
fso.CopyFile pptTempPdf, ReplaceExtension(pptx, ".pdf"), True

WScript.Echo "exported"

Function FindNewest(folderPath, ext, excludeText)
  Dim folder, file, bestPath, bestTime
  Set folder = fso.GetFolder(folderPath)
  bestPath = ""
  bestTime = #1/1/1900#
  For Each file In folder.Files
    If LCase(fso.GetExtensionName(file.Name)) = Replace(LCase(ext), ".", "") Then
      If excludeText = "" Or InStr(1, file.Name, excludeText, vbTextCompare) = 0 Then
        If file.DateLastModified > bestTime Then
          bestTime = file.DateLastModified
          bestPath = file.Path
        End If
      End If
    End If
  Next
  FindNewest = bestPath
End Function

Function ReplaceExtension(path, newExt)
  ReplaceExtension = fso.BuildPath(fso.GetParentFolderName(path), fso.GetBaseName(path) & newExt)
End Function
