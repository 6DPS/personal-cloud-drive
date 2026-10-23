' ==============================================================================
' DPSir 智云盘 - Silent Stopper
' Safely stops the watchdog and node server processes
' ==============================================================================
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
If fso.FolderExists(scriptDir & "\..\logs") Then
    rootDir = fso.GetAbsolutePathName(scriptDir & "\..")
Else
    rootDir = scriptDir
End If

stopCmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -Command """ & _
          "$portConn = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue; " & _
          "if ($portConn) { Stop-Process -Id $portConn.OwningProcess -Force -ErrorAction SilentlyContinue }; " & _
          "$pidFile = Join-Path '" & rootDir & "' 'logs\server-watchdog.pid'; " & _
          "if (Test-Path $pidFile) { $wPid = Get-Content $pidFile; Stop-Process -Id $wPid -Force -ErrorAction SilentlyContinue; Remove-Item $pidFile -Force -ErrorAction SilentlyContinue }"""

WshShell.Run stopCmd, 0, True
