@echo off
setlocal
cd /d "%~dp0"
echo ===================================================
echo   Installing Zircord - Universal Discord Rich Presence
echo ===================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\install.ps1"
echo.
echo Press any key to exit...
pause >nul
