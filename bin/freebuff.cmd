@echo off
setlocal
:: Start or notify Zircord in background for current working directory
if exist "%USERPROFILE%\.gemini\scripts\start-daemon.vbs" (
    wscript //B "%USERPROFILE%\.gemini\scripts\start-daemon.vbs" "%CD%" >nul 2>&1
) else if exist "%USERPROFILE%\.gemini\scripts\discord-rpc.js" (
    start /B node "%USERPROFILE%\.gemini\scripts\discord-rpc.js" "%CD%" >nul 2>&1
)

:: Run real Freebuff
if exist "%USERPROFILE%\.config\manicode\freebuff.exe" (
    "%USERPROFILE%\.config\manicode\freebuff.exe" %*
    exit /b %errorlevel%
)
if exist "%APPDATA%\npm\node_modules\freebuff\index.js" (
    node "%APPDATA%\npm\node_modules\freebuff\index.js" %*
    exit /b %errorlevel%
)
if exist "%LOCALAPPDATA%\npm\node_modules\freebuff\index.js" (
    node "%LOCALAPPDATA%\npm\node_modules\freebuff\index.js" %*
    exit /b %errorlevel%
)
freebuff.exe %*
exit /b %errorlevel%
