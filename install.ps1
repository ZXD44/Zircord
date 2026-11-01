# Install script for Clicord (Universal Discord Rich Presence for Terminal & CLI)
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "  ██████╗██╗     ██╗ ██████╗ ██████╗ ██████╗ ██████╗ " -ForegroundColor Cyan
Write-Host " ██╔════╝██║     ██║██╔════╝██╔═══██╗██╔══██╗██╔══██╗" -ForegroundColor Cyan
Write-Host " ██║     ██║     ██║██║     ██║   ██║██████╔╝██║  ██║" -ForegroundColor Cyan
Write-Host " ██║     ██║     ██║██║     ██║   ██║██╔══██╗██║  ██║" -ForegroundColor Cyan
Write-Host " ╚██████╗███████╗██║╚██████╗╚██████╔╝██║  ██║██████╔╝" -ForegroundColor Cyan
Write-Host "  ╚═════╝╚══════╝╚═╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝ " -ForegroundColor Cyan
Write-Host "      Universal Discord Rich Presence for Terminal & Any CLI " -ForegroundColor DarkGray
Write-Host ""

$userProfile = [System.Environment]::GetFolderPath('UserProfile')
$targetBin = Join-Path $userProfile ".gemini\bin"
$targetScripts = Join-Path $userProfile ".gemini\scripts"
$projDir = $PSScriptRoot

New-Item -ItemType Directory -Path $targetBin, $targetScripts -Force | Out-Null

# 1. Copy RPC Script
Write-Host "[1/4] Deploying Clicord RPC engine..." -ForegroundColor Yellow
Copy-Item (Join-Path $projDir "src\discord-rpc.js") (Join-Path $targetScripts "discord-rpc.js") -Force

# 2. Copy Executables & Wrappers
Write-Host "[2/4] Deploying universal shims and CLI watchers..." -ForegroundColor Yellow
Copy-Item (Join-Path $projDir "bin\clicord.cmd") (Join-Path $targetBin "clicord.cmd") -Force
Copy-Item (Join-Path $projDir "bin\clicord") (Join-Path $targetBin "clicord") -Force
Copy-Item (Join-Path $projDir "bin\agy.exe") (Join-Path $targetBin "agy.exe") -Force
Copy-Item (Join-Path $projDir "bin\agy.cmd") (Join-Path $targetBin "agy.cmd") -Force
Copy-Item (Join-Path $projDir "bin\agy") (Join-Path $targetBin "agy") -Force
Copy-Item (Join-Path $projDir "bin\agycord.cmd") (Join-Path $targetBin "agycord.cmd") -Force
Copy-Item (Join-Path $projDir "bin\agycord") (Join-Path $targetBin "agycord") -Force

if (-not (Test-Path (Join-Path $userProfile ".gemini\clicord.json"))) {
    Copy-Item (Join-Path $projDir "clicord.json") (Join-Path $userProfile ".gemini\clicord.json") -Force
}

# 3. Add to User PATH if not present
Write-Host "[3/4] Configuring Environment PATH..." -ForegroundColor Yellow
$userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$targetBin*") {
    $newPath = "$targetBin;$userPath"
    [System.Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Write-Host "      Added $targetBin to the front of User PATH" -ForegroundColor Green
} else {
    Write-Host "      $targetBin already active in User PATH" -ForegroundColor DarkGray
}

# 4. Check Node.js runtime
Write-Host "[4/4] Verifying Node.js runtime..." -ForegroundColor Yellow
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVer = node -v
    Write-Host "      Node.js found: $nodeVer" -ForegroundColor Green
} else {
    Write-Host "      WARNING: Node.js was not found in PATH. Please install Node.js (https://nodejs.org)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Installation Complete!" -ForegroundColor Green
Write-Host "  • Type 'clicord' in any project to track it on Discord" -ForegroundColor Cyan
Write-Host "  • Type 'agy' to run Antigravity CLI with automatic presence" -ForegroundColor Cyan
Write-Host ""
