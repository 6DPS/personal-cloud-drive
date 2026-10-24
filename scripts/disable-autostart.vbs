Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

userStartup = WshShell.SpecialFolders("Startup")
commonStartup = WshShell.SpecialFolders("AllUsersStartup")

silentName = "\DPSir " & ChrW(26234) & ChrW(20113) & ChrW(30424) & ChrW(21518) & ChrW(21488) & ChrW(26381) & ChrW(21153) & ".lnk"
legacyName = "\DPSir " & ChrW(26234) & ChrW(20113) & ChrW(30424) & ".lnk"
altName    = "\DPSir " & ChrW(26234) & ChrW(20113) & ChrW(30424) & ChrW(26381) & ChrW(21153) & ".lnk"

filesToDelete = Array( _
    userStartup & silentName, _
    userStartup & legacyName, _
    userStartup & altName, _
    commonStartup & silentName, _
    commonStartup & legacyName, _
    commonStartup & altName _
)

On Error Resume Next
For Each f In filesToDelete
    If fso.FileExists(f) Then
        fso.DeleteFile f, True
    End If
Next
On Error GoTo 0

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
    msg = ChrW(24050) & ChrW(25104) & ChrW(21151) & ChrW(20851) & ChrW(38381) & ChrW(24320) & ChrW(26426) & ChrW(33258) & ChrW(21551) & ChrW(65281) & vbCrLf & vbCrLf & ChrW(19979) & ChrW(27425) & ChrW(24320) & ChrW(26426) & ChrW(21518) & ChrW(23558) & ChrW(19981) & ChrW(20250) & ChrW(33258) & ChrW(21160) & ChrW(21551) & ChrW(21160) & ChrW(32593) & ChrW(30424) & ChrW(21518) & ChrW(21488) & ChrW(26381) & ChrW(21153) & ChrW(65292) & ChrW(20063) & ChrW(19981) & ChrW(20250) & ChrW(21344) & ChrW(29992) & " 8081 " & ChrW(31471) & ChrW(21475) & ChrW(12290) & vbCrLf & ChrW(33509) & ChrW(24179) & ChrW(26102) & ChrW(38656) & ChrW(35201) & ChrW(20351) & ChrW(29992) & ChrW(32593) & ChrW(30424) & ChrW(65292) & ChrW(21482) & ChrW(38656) & ChrW(21452) & ChrW(20987) & ChrW(26700) & ChrW(38754) & ChrW(12304) & "DPSir " & ChrW(26234) & ChrW(20113) & ChrW(30424) & ChrW(12305) & ChrW(22270) & ChrW(26631) & ChrW(21363) & ChrW(21487) & ChrW(31186) & ChrW(32423) & ChrW(24320) & ChrW(21551) & ChrW(12290)
    title = "DPSir " & ChrW(26234) & ChrW(20113) & ChrW(30424) & " - " & ChrW(24320) & ChrW(26426) & ChrW(33258) & ChrW(21551) & ChrW(35774) & ChrW(32622)
    MsgBox msg, 64, title
End If
