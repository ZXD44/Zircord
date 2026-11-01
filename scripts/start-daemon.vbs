Set WshShell = CreateObject("WScript.Shell")
userHome = WshShell.ExpandEnvironmentStrings("%USERPROFILE%")
engineScript = userHome & "\.gemini\scripts\discord-rpc.js"
WshShell.Run "node """ & engineScript & """ """ & userHome & """", 0, False
