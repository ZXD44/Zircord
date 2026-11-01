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
$projDir = $PSScriptRoot

New-Item -ItemType Directory -Path $targetBin, $targetScripts -Force | Out-Null

# 1. Copy RPC Script
Write-Host "[1/5] Deploying Zircord RPC engine..." -ForegroundColor Yellow
Copy-Item (Join-Path $projDir "src\discord-rpc.js") (Join-Path $targetScripts "discord-rpc.js") -Force

# 2. Copy Executables & Wrappers
Write-Host "[2/5] Deploying universal shims and CLI watchers..." -ForegroundColor Yellow
Copy-Item (Join-Path $projDir "bin\zircord.cmd") (Join-Path $targetBin "zircord.cmd") -Force
Copy-Item (Join-Path $projDir "bin\zircord") (Join-Path $targetBin "zircord") -Force
Copy-Item (Join-Path $projDir "bin\clicord.cmd") (Join-Path $targetBin "clicord.cmd") -Force
Copy-Item (Join-Path $projDir "bin\clicord") (Join-Path $targetBin "clicord") -Force
Copy-Item (Join-Path $projDir "bin\agy.exe") (Join-Path $targetBin "agy.exe") -Force
Copy-Item (Join-Path $projDir "bin\agy.cmd") (Join-Path $targetBin "agy.cmd") -Force
Copy-Item (Join-Path $projDir "bin\agy") (Join-Path $targetBin "agy") -Force

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
$vbsPath = Join-Path $startupFolder "zircord.vbs"
$engineScript = Join-Path $targetScripts "discord-rpc.js"
$vbsScript = "Set WshShell = CreateObject(`"WScript.Shell`")`nWshShell.Run `"node `"`"`"$engineScript`"`"`" `"`"`"$userProfile`"`"`"`, 0, False"
[System.IO.File]::WriteAllText($vbsPath, $vbsScript, [System.Text.Encoding]::ASCII)
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
Write-Host "  • Non-CLI Users: ไม่ต้องเปิดหน้าต่าง Terminal ใดๆ ระบบจะทำงานเงียบๆ ในแบ็กกราวด์ทันทีที่มี Discord" -ForegroundColor Cyan
Write-Host "  • CLI Users: สามารถพิมพ์ 'zircord status' หรือ 'zircord' ได้ตลอดเวลา" -ForegroundColor Cyan
Write-Host ""
