Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
rootDir = fso.GetAbsolutePathName(scriptDir & "\..")
startupFolder = WshShell.SpecialFolders("Startup")

silentName = "\DPSir " & ChrW(26234) & ChrW(20113) & ChrW(30424) & ChrW(21518) & ChrW(21488) & ChrW(26381) & ChrW(21153) & ".lnk"
legacyName = "\DPSir " & ChrW(26234) & ChrW(20113) & ChrW(30424) & ".lnk"

shortcutPath = startupFolder & silentName
oldShortcut = startupFolder & legacyName

If fso.FileExists(oldShortcut) Then
    On Error Resume Next
    fso.DeleteFile oldShortcut, True
    On Error GoTo 0
End If

Set oLink = WshShell.CreateShortcut(shortcutPath)
oLink.TargetPath = "wscript.exe"
oLink.Arguments = """" & rootDir & "\scripts\autostart-service.vbs"""
oLink.WorkingDirectory = rootDir
oLink.WindowStyle = 7
oLink.Description = "DPSir " & ChrW(26234) & ChrW(20113) & ChrW(30424) & " - " & ChrW(24320) & ChrW(26426) & ChrW(21518) & ChrW(21488) & ChrW(38745) & ChrW(40664) & ChrW(26381) & ChrW(21153)
iconFile = rootDir & "\app-icon.ico"
If fso.FileExists(iconFile) Then
    oLink.IconLocation = iconFile & ", 0"
End If
oLink.Save

isSilent = False
If WScript.Arguments.Count > 0 Then
    For i = 0 To WScript.Arguments.Count - 1
        arg = LCase(WScript.Arguments(i))
        If InStr(arg, "silent") > 0 Or arg = "/s" Then
            isSilent = True
        End If
    Next
End If

If Not isSilent Then
    msg = ChrW(24050) & ChrW(25104) & ChrW(21151) & ChrW(24320) & ChrW(21551) & ChrW(24320) & ChrW(26426) & ChrW(21518) & ChrW(21488) & ChrW(38745) & ChrW(40664) & ChrW(33258) & ChrW(21551) & ChrW(65281) & vbCrLf & vbCrLf & ChrW(30005) & ChrW(33041) & ChrW(24320) & ChrW(26426) & ChrW(21518) & ChrW(32593) & ChrW(30424) & ChrW(26381) & ChrW(21153) & ChrW(23558) & ChrW(22312) & ChrW(21518) & ChrW(21488) & ChrW(38745) & ChrW(40664) & ChrW(23601) & ChrW(32490) & ChrW(65288) & ChrW(31471) & ChrW(21475) & " 8081" & ChrW(65289) & ChrW(65292) & ChrW(25163) & ChrW(26426) & ChrW(19982) & ChrW(24179) & ChrW(26495) & ChrW(21487) & ChrW(38543) & ChrW(26102) & ChrW(36830) & ChrW(25509) & ChrW(65292) & ChrW(23631) & ChrW(24149) & ChrW(26080) & ChrW(24377) & ChrW(31383) & ChrW(25171) & ChrW(25200) & ChrW(12290)
    title = "DPSir " & ChrW(26234) & ChrW(20113) & ChrW(30424) & " - " & ChrW(24320) & ChrW(26426) & ChrW(33258) & ChrW(21551) & ChrW(35774) & ChrW(32622)
    MsgBox msg, 64, title
End If
