Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
If fso.FolderExists(scriptDir & "\..\logs") Then
    rootDir = fso.GetAbsolutePathName(scriptDir & "\..")
Else
    rootDir = scriptDir
End If

stopCmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -Command """ & _
          "Stop-Process -Name 'cloudflared' -Force -ErrorAction SilentlyContinue; " & _
          "Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }; " & _
          "$pidFile = Join-Path '" & rootDir & "' 'logs\server-watchdog.pid'; " & _
          "if (Test-Path $pidFile) { $wPid = Get-Content $pidFile; Stop-Process -Id $wPid -Force -ErrorAction SilentlyContinue; Remove-Item $pidFile -Force -ErrorAction SilentlyContinue }"""

WshShell.Run stopCmd, 0, True

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
    msg = "DPSir " & ChrW(26234) & ChrW(20113) & ChrW(30424) & ChrW(21518) & ChrW(21488) & ChrW(26381) & ChrW(21153) & ChrW(24050) & ChrW(25104) & ChrW(21151) & ChrW(20572) & ChrW(27490) & ChrW(65281) & vbCrLf & vbCrLf & "8081 " & ChrW(31471) & ChrW(21475) & ChrW(19982) & ChrW(20844) & ChrW(32593) & ChrW(31359) & ChrW(36879) & ChrW(38567) & ChrW(36947) & ChrW(24050) & ChrW(20840) & ChrW(37096) & ChrW(37322) & ChrW(25918) & ChrW(20851) & ChrW(38381) & ChrW(12290) & vbCrLf & ChrW(19979) & ChrW(27425) & ChrW(38656) & ChrW(35201) & ChrW(20351) & ChrW(29992) & ChrW(26102) & ChrW(65292) & ChrW(21482) & ChrW(38656) & ChrW(21452) & ChrW(20987) & ChrW(26700) & ChrW(38754) & ChrW(12304) & "DPSir " & ChrW(26234) & ChrW(20113) & ChrW(30424) & ChrW(12305) & ChrW(22270) & ChrW(26631) & ChrW(21363) & ChrW(21487) & ChrW(31186) & ChrW(32423) & ChrW(24320) & ChrW(21551) & ChrW(12290)
    title = "DPSir " & ChrW(26234) & ChrW(20113) & ChrW(30424)
    MsgBox msg, 64, title
End If
