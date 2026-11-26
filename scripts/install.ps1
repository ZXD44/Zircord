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

# 1. Copy RPC Script & Claude Hook Bridge
Write-Host "[1/5] Deploying Zircord RPC engine..." -ForegroundColor Yellow
$engineScript = Join-Path $targetScripts "discord-rpc.js"
Copy-Item (Join-Path $projDir "src\discord-rpc.js") $engineScript -Force
$claudeHookScript = Join-Path $targetScripts "claude-hook.js"
if (Test-Path (Join-Path $PSScriptRoot "claude-hook.js")) {
    Copy-Item (Join-Path $PSScriptRoot "claude-hook.js") $claudeHookScript -Force
}

# 2. Copy Executables & Wrappers
Write-Host "[2/5] Deploying universal shims and CLI watchers (Freebuff, Claude, Cursor, Aider, AGY, Kiro, Gemini, Windsurf)..." -ForegroundColor Yellow
$wrappers = @(
    "zircord.cmd", "zircord",
    "clicord.cmd", "clicord",
    "freebuff.cmd", "freebuff",
    "claude.cmd", "claude",
    "cursor.cmd", "cursor",
    "cursor-agent.cmd", "cursor-agent",
    "aider.cmd", "aider",
    "agy.cmd", "agy", "agy.exe",
    "kiro.cmd", "kiro",
    "kiro-cli.cmd", "kiro-cli",
    "gemini.cmd", "gemini",
    "windsurf.cmd", "windsurf"
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

# Register Claude Code hooks non-destructively if ~/.claude exists (uses native zircord.exe hook)
$claudeSettingsPath = Join-Path $userProfile ".claude\settings.json"
$zircordExe = Join-Path $targetBin "zircord.exe"
if ((Test-Path (Split-Path $claudeSettingsPath -Parent)) -and (Test-Path $zircordExe)) {
    node -e "const fs=require('fs'),p=process.argv[1],cmd=process.argv[2];let s={};try{if(fs.existsSync(p))s=JSON.parse(fs.readFileSync(p,'utf8'))}catch{};s.hooks=s.hooks||{};const evts=['UserPromptSubmit','PreToolUse','PostToolUse','Stop','SessionEnd'];for(const e of evts){const arr=Array.isArray(s.hooks[e])?s.hooks[e]:[];const idx=arr.findIndex(x=>JSON.stringify(x).includes('claude-hook.js')||JSON.stringify(x).includes('zircord'));if(idx>=0){arr[idx]={hooks:[{type:'command',command:cmd}]};}else{arr.push({hooks:[{type:'command',command:cmd}]});}s.hooks[e]=arr;}fs.writeFileSync(p,JSON.stringify(s,null,2));" $claudeSettingsPath "`"$zircordExe`" hook"
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

# 5. Launch Native Rust Service Immediately (fallback to Node.js if exe missing)
Write-Host "[5/5] Verifying and launching service..." -ForegroundColor Yellow
if (Test-Path $zircordExe) {
    & $zircordExe start $userProfile
    Write-Host "      Zircord Native Rust daemon is now active in the background!" -ForegroundColor Green
} elseif (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVer = node -v
    Write-Host "      Node.js fallback verified: $nodeVer" -ForegroundColor Green
    Start-Process -FilePath "node" -ArgumentList @($engineScript, $userProfile) -WindowStyle Hidden
    Write-Host "      Zircord is now active in the background!" -ForegroundColor Green
} else {
    Write-Host "      WARNING: Neither zircord.exe nor Node.js was found." -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Installation Complete!" -ForegroundColor Green
Write-Host "  • Windows Auto-Start: Enabled (รันอัตโนมัติทุกครั้งที่เปิดเครื่อง)" -ForegroundColor Cyan
Write-Host "  • All CLIs Supported: Freebuff, Claude Code, Cursor Agent, Aider, AGY, Neovim, Terminals & Shells" -ForegroundColor Cyan
Write-Host "  • Non-CLI Users: ไม่ต้องเปิดหน้าต่าง Terminal ใดๆ ระบบจะทำงานเงียบๆ ในแบ็กกราวด์ทันทีที่มี Discord" -ForegroundColor Cyan
Write-Host "  • CLI Users: สามารถพิมพ์ 'zircord status' หรือ 'zircord' ได้ตลอดเวลา" -ForegroundColor Cyan
Write-Host ""
