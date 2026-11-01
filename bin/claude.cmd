@echo off
setlocal
if exist "%USERPROFILE%\.gemini\scripts\start-daemon.vbs" (
    wscript //B "%USERPROFILE%\.gemini\scripts\start-daemon.vbs" "%CD%" >nul 2>&1
) else if exist "%USERPROFILE%\.gemini\scripts\discord-rpc.js" (
    start /B node "%USERPROFILE%\.gemini\scripts\discord-rpc.js" "%CD%" >nul 2>&1
)

if exist "%APPDATA%\npm\node_modules\@anthropic-ai\claude-code\cli.mjs" (
    node "%APPDATA%\npm\node_modules\@anthropic-ai\claude-code\cli.mjs" %*
    exit /b %errorlevel%
)
claude.exe %*
exit /b %errorlevel%
