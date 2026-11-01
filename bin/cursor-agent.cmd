@echo off
setlocal
if exist "%USERPROFILE%\.gemini\scripts\start-daemon.vbs" (
    wscript //B "%USERPROFILE%\.gemini\scripts\start-daemon.vbs" "%CD%" >nul 2>&1
) else if exist "%USERPROFILE%\.gemini\scripts\discord-rpc.js" (
    start /B node "%USERPROFILE%\.gemini\scripts\discord-rpc.js" "%CD%" >nul 2>&1
)

if exist "%LOCALAPPDATA%\cursor-agent\cursor-agent.cmd" (
    call "%LOCALAPPDATA%\cursor-agent\cursor-agent.cmd" %*
    exit /b %errorlevel%
)
cursor-agent.cmd %*
exit /b %errorlevel%
