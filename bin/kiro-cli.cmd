@echo off
setlocal
if exist "%USERPROFILE%\.gemini\scripts\start-daemon.vbs" (
    wscript //B "%USERPROFILE%\.gemini\scripts\start-daemon.vbs" "%CD%" >nul 2>&1
) else if exist "%USERPROFILE%\.gemini\scripts\discord-rpc.js" (
    start /B node "%USERPROFILE%\.gemini\scripts\discord-rpc.js" "%CD%" >nul 2>&1
)

if exist "%LOCALAPPDATA%\Kiro-Cli\kiro-cli.exe" (
    "%LOCALAPPDATA%\Kiro-Cli\kiro-cli.exe" %*
    exit /b %errorlevel%
)
kiro-cli.exe %*
exit /b %errorlevel%
