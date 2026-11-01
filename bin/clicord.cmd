@echo off
setlocal
if exist "%~dp0..\src\discord-rpc.js" (
    node "%~dp0..\src\discord-rpc.js" %*
) else if exist "%USERPROFILE%\.gemini\scripts\discord-rpc.js" (
    node "%USERPROFILE%\.gemini\scripts\discord-rpc.js" %*
) else (
    node src\discord-rpc.js %*
)
