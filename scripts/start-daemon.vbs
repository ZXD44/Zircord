Set WshShell = CreateObject("WScript.Shell")
userHome = WshShell.ExpandEnvironmentStrings("%USERPROFILE%")
If WScript.Arguments.Count > 0 Then
    targetDir = WScript.Arguments(0)
Else
    targetDir = userHome
End If
engineScript = userHome & "\.gemini\scripts\discord-rpc.js"
WshShell.Run "node """ & engineScript & """ """ & targetDir & """", 0, False
