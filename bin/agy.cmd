@echo off
setlocal
if exist "%USERPROFILE%\.gemini\scripts\start-daemon.vbs" (
    wscript //B "%USERPROFILE%\.gemini\scripts\start-daemon.vbs" "%CD%" >nul 2>&1
) else if exist "%USERPROFILE%\.gemini\scripts\discord-rpc.js" (
    start /B node "%USERPROFILE%\.gemini\scripts\discord-rpc.js" "%CD%" >nul 2>&1
)

if exist "%LOCALAPPDATA%\agy\bin\agy.exe" (
    "%LOCALAPPDATA%\agy\bin\agy.exe" %*
    exit /b %errorlevel%
)
if exist "%USERPROFILE%\.gemini\antigravity-cli\bin\agy.exe" (
    "%USERPROFILE%\.gemini\antigravity-cli\bin\agy.exe" %*
    exit /b %errorlevel%
)
agy.exe %*
exit /b %errorlevel%
