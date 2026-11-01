@echo off
setlocal
cd /d "%~dp0"
echo ===================================================
echo   Uninstalling Zircord...
echo ===================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\uninstall.ps1"
echo.
echo Press any key to exit...
pause >nul
