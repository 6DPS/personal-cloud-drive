' ==============================================================================
' DPSir 智云盘 - Silent Launcher
' Launches background watchdog server and opens dedicated desktop window / browser
' ==============================================================================
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
' Check if script is inside packaging or root
If fso.FolderExists(scriptDir & "\..\runtime") Then
    rootDir = fso.GetAbsolutePathName(scriptDir & "\..")
Else
    rootDir = scriptDir
End If

WshShell.CurrentDirectory = rootDir

' Set default environment
WshShell.Environment("PROCESS")("PORT") = "8081"
WshShell.Environment("PROCESS")("HOST") = "0.0.0.0"

' Find node executable
nodeExe = rootDir & "\runtime\node.exe"
If Not fso.FileExists(nodeExe) Then
    nodeExe = "node"
End If

' Start watchdog server silently
watchdogScript = rootDir & "\scripts\server-watchdog.js"
WshShell.Run """" & nodeExe & """ """ & watchdogScript & """", 0, False

' Wait for service to warm up
WScript.Sleep 1500

' Open in Edge App Mode (Native Window) or fallback to default browser
edgeX86 = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
edgeX64 = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
edgeExe = ""

If fso.FileExists(edgeX64) Then
    edgeExe = edgeX64
ElseIf fso.FileExists(edgeX86) Then
    edgeExe = edgeX86
End If

If edgeExe <> "" Then
    WshShell.Run """" & edgeExe & """ --app=http://localhost:8081 --window-size=1200,820", 1, False
Else
    WshShell.Run "powershell.exe -NoProfile -Command ""Start-Process http://localhost:8081""", 0, False
End If
