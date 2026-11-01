# Uninstall script for Zircord Discord Rich Presence
$ErrorActionPreference = "SilentlyContinue"

Write-Host "Uninstalling Zircord Discord Rich Presence..." -ForegroundColor Yellow

$userProfile = [System.Environment]::GetFolderPath('UserProfile')
$targetBin = Join-Path $userProfile ".gemini\bin"
$targetScripts = Join-Path $userProfile ".gemini\scripts"
$startupFolder = [System.Environment]::GetFolderPath('Startup')

# 1. Stop any running Zircord processes
try {
    Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*discord-rpc*" } | ForEach-Object {
        Stop-Process -Id $_.ProcessId -Force
    }
} catch {}

# 2. Remove Windows Auto-Start script
Remove-Item (Join-Path $startupFolder "zircord.vbs") -Force

# 3. Remove deployed binaries and scripts
Remove-Item (Join-Path $targetBin "zircord.cmd") -Force
Remove-Item (Join-Path $targetBin "zircord") -Force
Remove-Item (Join-Path $targetBin "clicord.cmd") -Force
Remove-Item (Join-Path $targetBin "clicord") -Force
Remove-Item (Join-Path $targetBin "agy.exe") -Force
Remove-Item (Join-Path $targetBin "agy.cmd") -Force
Remove-Item (Join-Path $targetBin "agy") -Force
Remove-Item (Join-Path $targetScripts "discord-rpc.js") -Force

Write-Host "Zircord uninstalled successfully and auto-start removed." -ForegroundColor Green
