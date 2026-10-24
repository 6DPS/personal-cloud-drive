Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

userStartup = WshShell.SpecialFolders("Startup")
commonStartup = WshShell.SpecialFolders("AllUsersStartup")

filesToDelete = Array( _
    userStartup & "\DPSir 智云盘后台服务.lnk", _
    userStartup & "\DPSir 智云盘.lnk", _
    userStartup & "\DPSir 智云盘服务.lnk", _
    commonStartup & "\DPSir 智云盘后台服务.lnk", _
    commonStartup & "\DPSir 智云盘.lnk", _
    commonStartup & "\DPSir 智云盘服务.lnk" _
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
    MsgBox "已成功关闭开机自启！" & vbCrLf & vbCrLf & "电脑开机后将不会自动启动智云盘后台服务，也不会占用 8081 端口。" & vbCrLf & "当您需要使用网盘时，只需双击桌面【DPSir 智云盘】图标即可快速启动。", 64, "DPSir 智云盘 - 开机自启设置"
End If