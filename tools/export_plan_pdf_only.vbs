Option Explicit

Dim fso, root, outDir, tempDir
Set fso = CreateObject("Scripting.FileSystemObject")
root = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))
outDir = fso.BuildPath(root, "output\contest-submission")
tempDir = "C:\Temp\contest-export"
If Not fso.FolderExists(tempDir) Then fso.CreateFolder(tempDir)

Dim planDocx
planDocx = FindNewest(outDir, ".docx", "PPT")
If planDocx = "" Then Err.Raise 1001, , "Plan DOCX not found."

Dim planTempDocx, planTempPdf
planTempDocx = fso.BuildPath(tempDir, "plan-pdf-only.docx")
planTempPdf = fso.BuildPath(tempDir, "plan-pdf-only.pdf")
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
WScript.Echo "plan pdf exported"

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
