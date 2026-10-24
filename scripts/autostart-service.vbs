Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
If fso.FileExists(scriptDir & "\server.js") Then
    rootDir = scriptDir
Else
    rootDir = fso.GetAbsolutePathName(scriptDir & "\..")
End If

WshShell.CurrentDirectory = rootDir
WshShell.Environment("PROCESS")("PORT") = "8081"
WshShell.Environment("PROCESS")("HOST") = "0.0.0.0"

nodeExe = rootDir & "\runtime\node.exe"
If Not fso.FileExists(nodeExe) Then
    nodeExe = "node.exe"
End If

watchdogScript = rootDir & "\scripts\server-watchdog.js"
WshShell.Run """" & nodeExe & """ """ & watchdogScript & """", 0, False