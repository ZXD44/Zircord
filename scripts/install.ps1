# Install script for Zircord (Universal Discord Rich Presence for Terminal, Shells & Roblox)
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host " ███████╗██╗██████╗  ██████╗ ██████╗ ██████╗ ██████╗ " -ForegroundColor Cyan
Write-Host " ╚══███╔╝██║██╔══██╗██╔════╝██╔═══██╗██╔══██╗██╔══██╗" -ForegroundColor Cyan
Write-Host "   ███╔╝ ██║██████╔╝██║     ██║   ██║██████╔╝██║  ██║" -ForegroundColor Cyan
Write-Host "  ███╔╝  ██║██╔══██╗██║     ██║   ██║██╔══██╗██║  ██║" -ForegroundColor Cyan
Write-Host " ███████╗██║██║  ██║╚██████╗╚██████╔╝██║  ██║██████╔╝" -ForegroundColor Cyan
Write-Host " ╚══════╝╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝ " -ForegroundColor Cyan
Write-Host "      Universal Discord Rich Presence by ZirconX             " -ForegroundColor DarkGray
Write-Host ""

$userProfile = [System.Environment]::GetFolderPath('UserProfile')
$targetBin = Join-Path $userProfile ".gemini\bin"
$targetScripts = Join-Path $userProfile ".gemini\scripts"
$projDir = Split-Path -Parent $PSScriptRoot

New-Item -ItemType Directory -Path $targetBin, $targetScripts -Force | Out-Null

# 1. Copy RPC Script
Write-Host "[1/5] Deploying Zircord RPC engine..." -ForegroundColor Yellow
$engineScript = Join-Path $targetScripts "discord-rpc.js"
Copy-Item (Join-Path $projDir "src\discord-rpc.js") $engineScript -Force

# 2. Copy Executables & Wrappers
Write-Host "[2/5] Deploying universal shims and CLI watchers (Freebuff, Claude, Cursor, Aider, AGY)..." -ForegroundColor Yellow
$wrappers = @(
    "zircord.cmd", "zircord",
    "clicord.cmd", "clicord",
    "freebuff.cmd", "freebuff",
    "claude.cmd", "claude",
    "cursor.cmd", "cursor",
    "aider.cmd", "aider",
    "agy.cmd", "agy", "agy.exe"
)

foreach ($w in $wrappers) {
    $srcFile = Join-Path $projDir "bin\$w"
    if (Test-Path $srcFile) {
        try {
            Copy-Item $srcFile (Join-Path $targetBin $w) -Force -ErrorAction Stop
        } catch {
            Write-Host "      Note: $w is active, skipping file overwrite." -ForegroundColor DarkGray
        }
    }
}

if (-not (Test-Path (Join-Path $userProfile ".gemini\zircord.json"))) {
    Copy-Item (Join-Path $projDir "zircord.json") (Join-Path $userProfile ".gemini\zircord.json") -Force
}

# 3. Add to User PATH if not present
Write-Host "[3/5] Configuring Environment PATH..." -ForegroundColor Yellow
$userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$targetBin*") {
    $newPath = "$targetBin;$userPath"
    [System.Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Write-Host "      Added $targetBin to the front of User PATH" -ForegroundColor Green
} else {
    Write-Host "      $targetBin already active in User PATH" -ForegroundColor DarkGray
}

# 4. Configure Auto-Start on Windows Boot (No CLI Required)
Write-Host "[4/5] Setting up Windows Auto-Start on Boot..." -ForegroundColor Yellow
$startupFolder = [System.Environment]::GetFolderPath('Startup')
$startupTarget = Join-Path $startupFolder "zircord.vbs"
$daemonVbs = Join-Path $PSScriptRoot "start-daemon.vbs"
Copy-Item $daemonVbs $startupTarget -Force
Write-Host "      Auto-start enabled! Zircord will silently run whenever Windows starts." -ForegroundColor Green

# 5. Check Node.js and Launch Service Immediately
Write-Host "[5/5] Verifying dependencies and launching service..." -ForegroundColor Yellow
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVer = node -v
    Write-Host "      Node.js verified: $nodeVer" -ForegroundColor Green
    
    # Launch background instance right now
    Start-Process -FilePath "node" -ArgumentList @($engineScript, $userProfile) -WindowStyle Hidden
    Write-Host "      Zircord is now active in the background!" -ForegroundColor Green
} else {
    Write-Host "      WARNING: Node.js was not found in PATH." -ForegroundColor Red
    Write-Host "      Please install Node.js from https://nodejs.org" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Installation Complete!" -ForegroundColor Green
Write-Host "  • Windows Auto-Start: Enabled (รันอัตโนมัติทุกครั้งที่เปิดเครื่อง)" -ForegroundColor Cyan
Write-Host "  • All CLIs Supported: Freebuff, Claude Code, Cursor Agent, Aider, AGY, Neovim, Terminals & Shells" -ForegroundColor Cyan
Write-Host "  • Non-CLI Users: ไม่ต้องเปิดหน้าต่าง Terminal ใดๆ ระบบจะทำงานเงียบๆ ในแบ็กกราวด์ทันทีที่มี Discord" -ForegroundColor Cyan
Write-Host "  • CLI Users: สามารถพิมพ์ 'zircord status' หรือ 'zircord' ได้ตลอดเวลา" -ForegroundColor Cyan
Write-Host ""
