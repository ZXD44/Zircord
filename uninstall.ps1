# Uninstall script for Zircord Discord Rich Presence
$ErrorActionPreference = "SilentlyContinue"

Write-Host "Uninstalling Zircord Discord Rich Presence..." -ForegroundColor Yellow

$userProfile = [System.Environment]::GetFolderPath('UserProfile')
$targetBin = Join-Path $userProfile ".gemini\bin"
$targetScripts = Join-Path $userProfile ".gemini\scripts"

# Remove deployed binaries
Remove-Item (Join-Path $targetBin "zircord.cmd") -Force
Remove-Item (Join-Path $targetBin "zircord") -Force
Remove-Item (Join-Path $targetBin "clicord.cmd") -Force
Remove-Item (Join-Path $targetBin "clicord") -Force
Remove-Item (Join-Path $targetBin "agy.exe") -Force
Remove-Item (Join-Path $targetBin "agy.cmd") -Force
Remove-Item (Join-Path $targetBin "agy") -Force
Remove-Item (Join-Path $targetScripts "discord-rpc.js") -Force

Write-Host "Uninstalled successfully." -ForegroundColor Green
