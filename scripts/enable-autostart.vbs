Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
rootDir = fso.GetAbsolutePathName(scriptDir & "\..")
startupFolder = WshShell.SpecialFolders("Startup")
shortcutPath = startupFolder & "\DPSir 智云盘后台服务.lnk"

oldShortcut = startupFolder & "\DPSir 智云盘.lnk"
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
oLink.Description = "DPSir 智云盘 - 开机后台静默自启服务"
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
    MsgBox "已成功开启开机后台静默自启！" & vbCrLf & vbCrLf & "电脑开机后网盘服务将在后台静默就绪（端口 8081），手机和平板可随时连接，绝不弹窗打扰您。", 64, "DPSir 智云盘 - 开机自启设置"
End If