@echo off
setlocal
if exist "%USERPROFILE%\.gemini\scripts\start-daemon.vbs" (
    wscript //B "%USERPROFILE%\.gemini\scripts\start-daemon.vbs" "%CD%" >nul 2>&1
) else if exist "%USERPROFILE%\.gemini\scripts\discord-rpc.js" (
    start /B node "%USERPROFILE%\.gemini\scripts\discord-rpc.js" "%CD%" >nul 2>&1
)

if exist "%APPDATA%\npm\node_modules\@google\gemini-cli\index.js" (
    node "%APPDATA%\npm\node_modules\@google\gemini-cli\index.js" %*
    exit /b %errorlevel%
)
if exist "%APPDATA%\npm\gemini.cmd" (
    call "%APPDATA%\npm\gemini.cmd" %*
    exit /b %errorlevel%
)
gemini.cmd %*
exit /b %errorlevel%
