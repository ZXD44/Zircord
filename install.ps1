# Install script for AGY Discord Rich Presence
$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Installing AGY Discord Rich Presence    " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$userProfile = [System.Environment]::GetFolderPath('UserProfile')
$targetBin = Join-Path $userProfile ".gemini\bin"
$targetScripts = Join-Path $userProfile ".gemini\scripts"
$projDir = $PSScriptRoot

New-Item -ItemType Directory -Path $targetBin, $targetScripts -Force | Out-Null

# 1. Copy RPC Script
Write-Host "[1/4] Copying RPC engine script..." -ForegroundColor Yellow
Copy-Item (Join-Path $projDir "src\discord-rpc.js") (Join-Path $targetScripts "discord-rpc.js") -Force

# 2. Copy Executables & Wrappers
Write-Host "[2/4] Deploying universal shims..." -ForegroundColor Yellow
Copy-Item (Join-Path $projDir "bin\agy.exe") (Join-Path $targetBin "agy.exe") -Force
Copy-Item (Join-Path $projDir "bin\agy.cmd") (Join-Path $targetBin "agy.cmd") -Force
Copy-Item (Join-Path $projDir "bin\agy") (Join-Path $targetBin "agy") -Force

# 3. Add to User PATH if not present
Write-Host "[3/4] Checking User Environment PATH..." -ForegroundColor Yellow
$userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$targetBin*") {
    $newPath = "$targetBin;$userPath"
    [System.Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Write-Host "      Added $targetBin to the front of User PATH" -ForegroundColor Green
} else {
    Write-Host "      $targetBin already in User PATH" -ForegroundColor DarkGray
}

# 4. Check Node.js
Write-Host "[4/4] Verifying Node.js runtime..." -ForegroundColor Yellow
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVer = node -v
    Write-Host "      Node.js found: $nodeVer" -ForegroundColor Green
} else {
    Write-Host "      WARNING: Node.js was not found in PATH. Please install Node.js (https://nodejs.org)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Installation Complete! Restart your terminal and run 'agy'." -ForegroundColor Green
