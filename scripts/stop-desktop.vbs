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
          "$portConn = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue; " & _
          "if ($portConn) { Stop-Process -Id $portConn.OwningProcess -Force -ErrorAction SilentlyContinue }; " & _
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
    MsgBox "DPSir 智云盘服务已成功停止！" & vbCrLf & vbCrLf & "8081 端口与公网隧道已全部释放关闭。" & vbCrLf & "下次需要使用时，只需双击桌面【DPSir 智云盘】图标即可开启。", 64, "DPSir 智云盘"
End If
