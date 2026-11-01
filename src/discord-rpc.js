const net = require("net");
const path = require("path");
const fs = require("fs");
const { execSync, spawn, exec } = require("child_process");

// ==========================================
// ⚙️ UNIVERSAL CONFIGURATION LOADER
// ==========================================
const userHome = process.env.USERPROFILE || process.env.HOME || "";
const localAppData = process.env.LOCALAPPDATA || path.join(userHome, "AppData", "Local");
const globalConfigPath = fs.existsSync(path.join(userHome, ".gemini", "zircord.json"))
    ? path.join(userHome, ".gemini", "zircord.json")
    : path.join(userHome, ".gemini", "clicord.json");
const localConfigPath = fs.existsSync(path.join(process.cwd(), "zircord.json"))
    ? path.join(process.cwd(), "zircord.json")
    : path.join(process.cwd(), "clicord.json");
const pidFile = path.join(userHome, ".gemini", "zircord.pid");

function loadConfig() {
    const defaultUser = process.env.ZIRCORD_USER ||
                        process.env.CLICORD_USER || 
                        process.env.AGY_USER || 
                        process.env.USERNAME || 
                        process.env.USER || 
                        "ZirconX";

    let cfg = {
        theme: "thai",
        username: defaultUser,
        afkTimeoutMinutes: 5,
        showButtons: true,
        profileUrl: "",
        showGitStats: true,
        enableRobloxDetection: true,
        enableFreebuffDetection: true,
        enableAgentDetection: true,
        enableCliDetection: true,
        clientId: ""
    };

    try {
        if (fs.existsSync(localConfigPath)) {
            cfg = { ...cfg, ...JSON.parse(fs.readFileSync(localConfigPath, "utf8")) };
        } else if (fs.existsSync(globalConfigPath)) {
            cfg = { ...cfg, ...JSON.parse(fs.readFileSync(globalConfigPath, "utf8")) };
        }
    } catch {}
    return cfg;
}

let config = loadConfig();

// ==========================================
// ⚡ ASYNC NON-BLOCKING PROCESS SCANNER
// ==========================================
let cachedProcessNames = new Set();
let isScanningProcesses = false;
let lastProcessScanTime = 0;

function refreshProcessListAsync() {
    if (isScanningProcesses) return;
    const now = Date.now();
    if (now - lastProcessScanTime < 3000) return;

    isScanningProcesses = true;
    const cmd = process.platform === "win32" ? "tasklist /NH /FO CSV" : "ps -A -o comm=";
    exec(cmd, { encoding: "utf8", timeout: 5000 }, (err, stdout) => {
        isScanningProcesses = false;
        lastProcessScanTime = Date.now();
        if (err || !stdout) return;

        const newSet = new Set();
        if (process.platform === "win32") {
            const lines = stdout.split(/\r?\n/);
            for (const line of lines) {
                const match = line.match(/^"([^"]+)"/);
                if (match) {
                    newSet.add(match[1].toLowerCase());
                }
            }
        } else {
            const lines = stdout.split("\n");
            for (const line of lines) {
                const trimmed = line.trim().toLowerCase();
                if (trimmed) newSet.add(trimmed);
            }
        }
        cachedProcessNames = newSet;
    });
}

// Quick sync probe on startup for immediate detection
try {
    if (process.platform === "win32") {
        const out = execSync("tasklist /NH /FO CSV", { encoding: "utf8", timeout: 2000 });
        const lines = out.split(/\r?\n/);
        for (const line of lines) {
            const match = line.match(/^"([^"]+)"/);
            if (match) cachedProcessNames.add(match[1].toLowerCase());
        }
    }
} catch {}
refreshProcessListAsync();

// ==========================================
// 🕹️ CLI DAEMON CONTROL (start / stop / status / run)
// ==========================================
function ensureDaemonRunning(targetDir) {
    let isRunning = false;
    try {
        if (fs.existsSync(pidFile)) {
            const info = JSON.parse(fs.readFileSync(pidFile, "utf8"));
            if (info && info.pid) {
                process.kill(info.pid, 0);
                isRunning = true;
            }
        }
    } catch {}

    if (!isRunning) {
        const scriptPath = __filename;
        const target = targetDir ? path.resolve(targetDir) : process.cwd();
        if (process.platform === "win32") {
            const escapedScript = scriptPath.replace(/'/g, "''");
            const escapedTarget = target.replace(/'/g, "''");
            const nodeExe = process.execPath.replace(/'/g, "''");
            const psCmd = `Start-Process -FilePath '${nodeExe}' -ArgumentList @('${escapedScript}', '${escapedTarget}') -WorkingDirectory '${escapedTarget}' -WindowStyle Hidden`;
            try { execSync(`powershell -NoProfile -WindowStyle Hidden -Command "${psCmd}"`); } catch {}
        } else {
            const child = spawn(process.execPath, [scriptPath, target], { detached: true, stdio: "ignore" });
            child.unref();
        }
    }
}

function handleCliCommands() {
    const rawCmd = process.argv[2] || "";
    const cmd = rawCmd.toLowerCase();

    if (cmd === "stop") {
        let killed = false;
        try {
            if (fs.existsSync(pidFile)) {
                const info = JSON.parse(fs.readFileSync(pidFile, "utf8"));
                if (info && info.pid) {
                    process.kill(info.pid);
                    killed = true;
                }
                fs.unlinkSync(pidFile);
            }
        } catch {}

        try {
            if (process.platform === "win32") {
                execSync('wmic process where "name=\'node.exe\' and commandline like \'%discord-rpc%\' and processid!=' + process.pid + '" call terminate', { stdio: "ignore" });
                killed = true;
            } else {
                execSync('pkill -f discord-rpc.js', { stdio: "ignore" });
                killed = true;
            }
        } catch {}

        console.log(killed ? "✅ Zircord daemon stopped." : "ℹ️ No running Zircord daemon found.");
        process.exit(0);
    }

    if (cmd === "status") {
        let isRunning = false;
        let pid = null;
        let dir = "";
        try {
            if (fs.existsSync(pidFile)) {
                const info = JSON.parse(fs.readFileSync(pidFile, "utf8"));
                if (info && info.pid) {
                    process.kill(info.pid, 0);
                    isRunning = true;
                    pid = info.pid;
                    dir = info.targetDir || "";
                }
            }
        } catch {}

        console.log("🌌 Zircord Rich Presence Status:");
        if (isRunning) {
            console.log(`  ● Daemon:      RUNNING (PID: ${pid})`);
            console.log(`  ● Directory:   ${dir || process.cwd()}`);
            console.log(`  ● Theme:       ${config.theme}`);
            console.log(`  ● User:        ${config.username}`);
            
            // Show active detected CLI / agent
            const detected = [];
            const fb = getFreebuffActivity(dir || process.cwd());
            if (fb) detected.push(`Freebuff AI (PID: ${fb.pid || "Active"}, Project: ${fb.projectName})`);
            const agy = getAntigravityActivity();
            if (agy) detected.push(`Antigravity Agent (${agy.action})`);
            const otherAgent = getOtherAiAgentActivity();
            if (otherAgent) detected.push(otherAgent.name);
            const editor = getActiveTerminalEditor();
            if (editor) detected.push(`Editor: ${editor}`);
            const devCli = getActiveDevCli();
            if (devCli) detected.push(`CLI Tool: ${devCli.name}`);
            const shell = getActiveShell();
            if (shell) detected.push(`Shell: ${shell}`);
            const rbx = getRobloxStudioInfo(dir || process.cwd());
            if (rbx) detected.push(`Roblox Studio (${rbx.placeTitle})`);

            if (detected.length > 0) {
                console.log(`  ● Active CLIs: ${detected.join(", ")}`);
            } else {
                console.log(`  ● Active CLIs: Terminal ready`);
            }
        } else {
            console.log("  ○ Daemon:      STOPPED");
            console.log("  💡 Run 'zircord' or 'zircord start' to launch.");
        }
        process.exit(0);
    }

    if (cmd === "start") {
        const target = process.argv[3] ? path.resolve(process.argv[3]) : process.cwd();
        const scriptPath = __filename;

        if (process.platform === "win32") {
            const escapedScript = scriptPath.replace(/'/g, "''");
            const escapedTarget = target.replace(/'/g, "''");
            const nodeExe = process.execPath.replace(/'/g, "''");
            const psCmd = `Start-Process -FilePath '${nodeExe}' -ArgumentList @('${escapedScript}', '${escapedTarget}') -WorkingDirectory '${escapedTarget}' -WindowStyle Hidden`;
            execSync(`powershell -NoProfile -WindowStyle Hidden -Command "${psCmd}"`);
        } else {
            const child = spawn(process.execPath, [scriptPath, target], {
                detached: true,
                stdio: "ignore"
            });
            child.unref();
        }

        console.log(`🚀 Zircord daemon started in background.`);
        console.log(`📁 Monitoring: ${target}`);
        process.exit(0);
    }

    if (cmd === "run") {
        const cliToRun = process.argv[3];
        const cliArgs = process.argv.slice(4);
        if (!cliToRun) {
            console.log("Usage: zircord run <command> [args...]");
            console.log("Example: zircord run freebuff");
            console.log("         zircord run nvim");
            console.log("         zircord run cargo test");
            process.exit(1);
        }
        ensureDaemonRunning(process.cwd());
        const proc = spawn(cliToRun, cliArgs, { stdio: "inherit", shell: true });
        proc.on("exit", (code) => { process.exit(code || 0); });
        return;
    }

    if (cmd === "--help" || cmd === "-h" || cmd === "help") {
        console.log(`
🌌 Zircord - Intelligent Discord Rich Presence for Terminal & Any CLI

Usage:
  zircord [path]               Run Zircord monitoring current or target folder
  zircord start [path]         Start Zircord daemon in background
  zircord stop                 Stop all running Zircord daemon processes
  zircord status               Show running daemon status & active CLIs
  zircord run <cli> [args...]  Run any CLI with active Zircord tracking
  zircord <cli> [args...]      Direct shortcut to run any CLI tool

Supported CLIs & AI Agents:
  • AI Agents: Freebuff, Claude Code, Cursor Agent, Aider, AGY, Gemini, OpenCode, Codex, Copilot, Goose, Ollama
  • Editors:   Neovim, Vim, Helix, Micro, Nano, Emacs
  • Dev Tools: Cargo, Bun, Deno, Docker, Kubernetes, Git, Python, Go, Node, Vitest
  • Shells:    Windows Terminal, PowerShell 7, PowerShell, CMD, Bash, WSL, Nushell, Fish

Aliases:
  clicord (backward-compatible)

Configuration:
  zircord.json (in current directory or ~/.gemini/zircord.json)
`);
        process.exit(0);
    }

    // Auto-run fallback: If first argument is an executable/CLI and not a folder path
    if (rawCmd && !fs.existsSync(rawCmd) && !["start", "stop", "status", "run", "--help", "-h", "help"].includes(cmd)) {
        ensureDaemonRunning(process.cwd());
        const cliArgs = process.argv.slice(3);
        const proc = spawn(rawCmd, cliArgs, { stdio: "inherit", shell: true });
        proc.on("exit", (code) => { process.exit(code || 0); });
        return;
    }
}

handleCliCommands();

// Default Application IDs:
// - "383226320970055681" -> "Playing Visual Studio Code"
// - "1199942284653903882" -> "Playing Roblox Studio"
const VSCODE_CLIENT_ID = "383226320970055681";
const ROBLOX_CLIENT_ID = "1199942284653903882";

function getActiveClientId(rbxInfo) {
    if (config.clientId) return config.clientId;
    if (process.env.DISCORD_CLIENT_ID) return process.env.DISCORD_CLIENT_ID;
    if (rbxInfo && rbxInfo.isRoblox) return ROBLOX_CLIENT_ID;
    return VSCODE_CLIENT_ID;
}

let activeClientId = VSCODE_CLIENT_ID;
let targetDir = process.cwd();
if (process.argv[2] && fs.existsSync(process.argv[2])) {
    targetDir = path.resolve(process.argv[2]);
}

try {
    fs.writeFileSync(pidFile, JSON.stringify({
        pid: process.pid,
        targetDir: targetDir,
        startedAt: new Date().toISOString()
    }));
} catch {}

process.on("exit", () => {
    try {
        if (fs.existsSync(pidFile)) {
            const info = JSON.parse(fs.readFileSync(pidFile, "utf8"));
            if (info && info.pid === process.pid) fs.unlinkSync(pidFile);
        }
    } catch {}
});

const startTimestamp = Math.floor(Date.now() / 1000);
let lastActivityTime = Date.now();
let lastTrackedTarget = "";

const TEMPLATES = {
    thai: {
        freebuff: (project, prompt, action) => {
            if (prompt) return `🤖 Freebuff: ${prompt}`;
            if (action) return `🤖 Freebuff กำลัง${action}`;
            return `🤖 Freebuff AI :: ${project}`;
        },
        aiAgent: (name, project, prompt) => prompt ? `🤖 ${name}: ${prompt}` : `🤖 ${name} พร้อมใช้งาน :: ${project}`,
        cliTool: (name, folder, lang) => `⚙️ รัน: ${name}${lang ? ` (${lang})` : ""} :: ${folder}`,
        cliEditor: (editor, file, folder) => file ? `🔥 ${editor} :: ${file}` : `🔥 ${editor} :: ${folder}`,
        cliShell: (shell, folder) => `💻 ${shell} :: ${folder}`,
        writing: (lang, file, sub) => `🔥 เขียนโค้ด: ${file}${sub ? ` (${sub})` : ""}`,
        reading: (lang, file, sub) => `📖 ส่องโค้ด: ${file}${sub ? ` (${sub})` : ""}`,
        running: (target) => `⚙️ รัน: ${target}`,
        searching: (query) => `🔍 ค้นหา: ${query}`,
        planning: (task) => `🧠 วางแผน: ${task}`,
        idleLang: (lang) => `🔥 ทำโปรเจกต์ ${lang}`,
        idleGeneric: (folder) => {
            if (folder === "เทอร์มินัล" || folder === "Terminal") {
                return "💻 เทอร์มินัลพร้อมใช้งาน";
            }
            return `💻 เขียนโค้ดใน ${folder}`;
        },
        idleRoblox: (place) => `🎮 Roblox: ${place}`,
        afkDetails: () => `☕ พักสายตา / AFK`,
        afkState: () => `พักผ่อนแป๊บเดียว`,
        state: (user, folder, git, isRoblox) => {
            const isUserFolder = folder && user && folder.toLowerCase() === user.toLowerCase();
            const safeFolder = isUserFolder ? "เทอร์มินัล" : folder;
            const icon = isRoblox ? "🎮" : "📁";
            if (safeFolder === "เทอร์มินัล" || safeFolder === "Terminal") {
                return git ? `💻 เทอร์มินัล${git}` : "💻 เทอร์มินัล";
            }
            return `${icon} ${safeFolder}${git || ""}`;
        },
        gitFormat: (branch, dirty, diff) => {
            if (!branch && !dirty && !diff) return "";
            const bStr = branch ? ` (${branch})` : "";
            if (diff) return `${bStr} • ✏️ ${diff}`;
            if (dirty) return `${bStr} • ✏️ ${dirty} ไฟล์`;
            return bStr;
        }
    },
    modern: {
        freebuff: (project, prompt) => prompt ? `🤖 Freebuff: ${prompt}` : `🤖 Freebuff AI active in ${project}`,
        aiAgent: (name, project, prompt) => prompt ? `🤖 ${name}: ${prompt}` : `🤖 ${name} active @ ${project}`,
        cliTool: (name, folder, lang) => `⚡ Running ${name}${lang ? ` (${lang})` : ""} in ${folder}`,
        cliEditor: (editor, file, folder) => file ? `⚡ ${editor} :: ${file}` : `⚡ ${editor} @ ${folder}`,
        cliShell: (shell, folder) => `💻 ${shell} @ ${folder}`,
        writing: (lang, file, sub) => `⚡ Writing ${lang}${sub ? ` (${sub})` : ""}: ${file}`,
        reading: (lang, file, sub) => `📖 Reading: ${file} (${lang})`,
        running: (target) => `⚙️ Executing: ${target}`,
        searching: (query) => `🔍 Researching: ${query}`,
        planning: (task) => `🧠 Architecting: ${task}`,
        idleLang: (lang) => `⚡ Developing ${lang} Project`,
        idleGeneric: (folder) => (folder === "Terminal" || folder === "เทอร์มินัล") ? `💻 Working in Terminal` : `💻 Crafting in ${folder}`,
        idleRoblox: (place) => `🎮 Building Roblox: ${place}`,
        afkDetails: () => `☕ On a Coffee Break / AFK`,
        afkState: (user) => `Taking a short rest • 👤 ${user}`,
        state: (user, folder, git, isRoblox) => {
            const isUserFolder = folder && user && folder.toLowerCase() === user.toLowerCase();
            const safeFolder = isUserFolder ? "Terminal" : folder;
            const prefix = isRoblox ? `🎮 ${safeFolder} • 👤 ${user}` : `👤 ${user}`;
            const isTerminal = safeFolder === "Terminal" || safeFolder === "เทอร์มินัล";
            const folderPart = isTerminal ? `• 💻 Terminal` : `@ ${safeFolder}`;
            if (git) return `${prefix} ${folderPart}${git ? ` (${git})` : ""}`;
            return `${prefix} ${folderPart}`;
        },
        gitFormat: (branch, dirty, diff) => {
            const parts = [];
            if (branch) parts.push(`🌿 ${branch}`);
            if (dirty) {
                const diffStr = diff ? ` [${diff}]` : "";
                parts.push(`⚡ ${dirty} modified${diffStr}`);
            }
            return parts.join(" • ");
        }
    },
    cyber: {
        freebuff: (project, prompt) => prompt ? `🤖 [FREEBUFF] ${prompt}` : `🤖 [FREEBUFF] Neural Node :: ${project}`,
        aiAgent: (name, project, prompt) => prompt ? `🤖 [${name.toUpperCase()}] ${prompt}` : `🤖 [${name.toUpperCase()}] Neural Active :: ${project}`,
        cliTool: (name, folder) => `🔥 [EXEC:${name.toUpperCase()}] ${folder}`,
        cliEditor: (editor, file) => `💻 [${editor.toUpperCase()}] ${file || "BUFFER"}`,
        cliShell: (shell, folder) => `💻 [SHELL:${shell.toUpperCase()}] ${folder}`,
        writing: (lang, file, sub) => `⚡ [DEV] ${lang}${sub ? `:${sub}` : ""} // ${file}`,
        reading: (lang, file) => `👁️ [INSPECT] ${file}`,
        running: (target) => `🔥 [EXEC] ${target}`,
        searching: (query) => `📡 [SCAN] ${query}`,
        planning: (task) => `🧬 [MATRIX] ${task}`,
        idleLang: (lang) => `⚡ [ONLINE] ${lang} Node`,
        idleGeneric: (folder) => (folder === "Terminal" || folder === "เทอร์มินัล") ? `💻 [IDLE] Root Terminal` : `💻 [IDLE] ${folder} Shell`,
        idleRoblox: (place) => `🎮 [ROBLOX] ${place}`,
        afkDetails: () => `💤 [STANDBY] Node Idle`,
        afkState: (user) => `root@${user} // sleep_mode`,
        state: (user, folder, git) => {
            const isUserFolder = folder && user && folder.toLowerCase() === user.toLowerCase();
            const safeFolder = isUserFolder ? "Terminal" : folder;
            return `root@${user} // ${safeFolder}${git ? ` [${git}]` : ""}`;
        },
        gitFormat: (branch, dirty, diff) => {
            const parts = [];
            if (branch) parts.push(`git:${branch}`);
            if (dirty) {
                const diffStr = diff ? `:${diff}` : "";
                parts.push(`dirty:${dirty}${diffStr}`);
            }
            return parts.join(" | ");
        }
    },
    cozy: {
        freebuff: (project, prompt) => prompt ? `🤖 Freebuff ช่วยเขียน: ${prompt}` : `🤖 ชวน Freebuff นั่งทำ ${project}`,
        aiAgent: (name, project, prompt) => prompt ? `🤖 ${name} กำลังช่วย: ${prompt}` : `🤖 ชวน ${name} มาช่วยเขียนโค้ด`,
        cliTool: (name, folder) => `🍃 รันคำสั่ง ${name} เพลินๆ ใน ${folder}`,
        cliEditor: (editor, file) => file ? `☕ จิบกาแฟเปิด ${editor}: ${file}` : `☕ เปิด ${editor} พร้อมทำงาน`,
        cliShell: (shell, folder) => `✨ เปิด ${shell} ใน ${folder}`,
        writing: (lang, file, sub) => `☕ จิบกาแฟปั่น ${lang}: ${file}`,
        reading: (lang, file) => `📚 นั่งอ่านโค้ด: ${file}`,
        running: (target) => `🔨 เทสต์ระบบ: ${target}`,
        searching: (query) => `🔎 ส่องไอเดีย: ${query}`,
        planning: (task) => `💭 วางแผนทำของเจ๋งๆ`,
        idleLang: (lang) => `🍃 ชิลล์ๆ กับ ${lang}`,
        idleGeneric: (folder) => (folder === "ห้องทำงาน" || folder === "เทอร์มินัล" || folder === "Terminal") ? `✨ เปิดเครื่องพร้อมลุยงาน` : `✨ อยู่ในโฟลเดอร์ ${folder}`,
        idleRoblox: (place) => `🎮 นั่งทำเกม Roblox: ${place}`,
        afkDetails: () => `☕ จิบชาพักผ่อน / AFK`,
        afkState: (user) => `🌱 ${user} กำลังพักผ่อน`,
        state: (user, folder, git) => {
            const isUserFolder = folder && user && folder.toLowerCase() === user.toLowerCase();
            const safeFolder = isUserFolder ? "ห้องทำงาน" : folder;
            return `🌱 ${user} ใน ${safeFolder}${git ? ` (${git})` : ""}`;
        },
        gitFormat: (branch, dirty, diff) => {
            const parts = [];
            if (branch) parts.push(`🌿 ${branch}`);
            if (dirty) {
                const diffStr = diff ? ` [${diff}]` : "";
                parts.push(`✏️ แก้ไป ${dirty} จุด${diffStr}`);
            }
            return parts.join(" • ");
        }
    }
};

const LANG_MAP = {
    js: { icon: "js", name: "JavaScript" },
    jsx: { icon: "jsx", name: "React JSX" },
    ts: { icon: "ts", name: "TypeScript" },
    tsx: { icon: "tsx", name: "React TSX" },
    py: { icon: "python", name: "Python" },
    lua: { icon: "lua", name: "Luau" },
    luau: { icon: "lua", name: "Luau" },
    rs: { icon: "rust", name: "Rust" },
    go: { icon: "go", name: "Go" },
    c: { icon: "c", name: "C" },
    cpp: { icon: "cpp", name: "C++" },
    cs: { icon: "csharp", name: "C#" },
    json: { icon: "json", name: "JSON" },
    md: { icon: "markdown", name: "Markdown" },
    html: { icon: "html", name: "HTML5" },
    css: { icon: "css", name: "CSS3" },
    rb: { icon: "ruby", name: "Ruby" },
    php: { icon: "php", name: "PHP" },
    sh: { icon: "shell", name: "Shell Script" },
    ps1: { icon: "powershell", name: "PowerShell" },
    sql: { icon: "sql", name: "SQL Database" },
    docker: { icon: "docker", name: "Docker" },
    dockerfile: { icon: "docker", name: "Docker" },
    yaml: { icon: "yaml", name: "YAML" },
    yml: { icon: "yaml", name: "YAML" },
    toml: { icon: "toml", name: "TOML" }
};

function cleanStr(s) {
    if (!s) return "";
    return s.toString().replace(/^["']|["']$/g, "").trim();
}

function getLuauScriptSubtype(filename) {
    const lower = filename.toLowerCase();
    if (lower.includes(".client.") || lower.includes(".local.")) return "Client";
    if (lower.includes(".server.")) return "Server";
    if (lower.endsWith(".luau") || lower.endsWith(".lua")) return "Module";
    return "";
}

function getRobloxStudioInfo(target) {
    if (!config.enableRobloxDetection) return null;

    let studioRunning = false;
    let placeTitle = null;

    if (cachedProcessNames.has("robloxstudiobeta.exe") || cachedProcessNames.has("robloxstudio.exe")) {
        studioRunning = true;
    }

    let rojoProjectName = null;
    try {
        const defaultProj = path.join(target, "default.project.json");
        if (fs.existsSync(defaultProj)) {
            const data = JSON.parse(fs.readFileSync(defaultProj, "utf8"));
            rojoProjectName = data.name || null;
        }
    } catch {}

    let hasRobloxFiles = false;
    try {
        if (fs.existsSync(path.join(target, "wally.toml")) || 
            fs.existsSync(path.join(target, "rokit.toml")) ||
            fs.existsSync(path.join(target, "aftman.toml"))) {
            hasRobloxFiles = true;
        } else {
            const files = fs.readdirSync(target);
            hasRobloxFiles = files.some(f => f.endsWith(".rbxl") || f.endsWith(".rbxlx") || f.endsWith(".luau"));
        }
    } catch {}

    if (studioRunning && !rojoProjectName) {
        const candidateLogDirs = [
            path.join(localAppData, "Roblox", "logs"),
            path.join(localAppData, "Bloxstrap", "Logs")
        ];

        for (const logsDir of candidateLogDirs) {
            try {
                if (!fs.existsSync(logsDir)) continue;
                const files = fs.readdirSync(logsDir)
                    .filter(f => f.endsWith(".log"))
                    .map(f => ({ path: path.join(logsDir, f), time: fs.statSync(path.join(logsDir, f)).mtimeMs }))
                    .sort((a, b) => b.time - a.time);

                if (files.length > 0) {
                    const latestLog = files[0].path;
                    const stat = fs.statSync(latestLog);
                    const readSize = Math.min(stat.size, 32768);
                    const buf = Buffer.alloc(readSize);
                    const fd = fs.openSync(latestLog, "r");
                    fs.readSync(fd, buf, 0, readSize, stat.size - readSize);
                    fs.closeSync(fd);

                    const content = buf.toString("utf8");
                    const match = content.match(/Loaded place\s+([^\r\n,]+)/i) ||
                                  content.match(/Opening place\s+([^\r\n,]+)/i);
                    if (match) {
                        placeTitle = match[1].trim();
                        break;
                    }
                }
            } catch {}
        }
    }

    if (studioRunning || rojoProjectName || hasRobloxFiles) {
        return {
            isRoblox: true,
            studioRunning,
            placeTitle: placeTitle || rojoProjectName || "Roblox Experience",
            rojoProjectName,
            hasRojo: Boolean(rojoProjectName)
        };
    }

    return null;
}

function detectProjectLanguage(dir) {
    try {
        const rbx = getRobloxStudioInfo(dir);
        if (rbx) return { icon: "lua", name: "Roblox Luau", roblox: rbx };

        if (fs.existsSync(path.join(dir, "Cargo.toml"))) return LANG_MAP.rs;
        if (fs.existsSync(path.join(dir, "tsconfig.json"))) return LANG_MAP.ts;
        if (fs.existsSync(path.join(dir, "package.json"))) return LANG_MAP.js;
        if (fs.existsSync(path.join(dir, "requirements.txt")) || fs.existsSync(path.join(dir, "pyproject.toml"))) return LANG_MAP.py;
        if (fs.existsSync(path.join(dir, "go.mod"))) return LANG_MAP.go;

        const files = fs.readdirSync(dir, { withFileTypes: true });
        const counts = {};
        for (const f of files) {
            if (f.isFile()) {
                const ext = path.extname(f.name).slice(1).toLowerCase();
                if (LANG_MAP[ext]) {
                    counts[ext] = (counts[ext] || 0) + 1;
                }
            }
        }
        const dominant = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
        if (dominant && LANG_MAP[dominant]) return LANG_MAP[dominant];
    } catch {}
    return { icon: "vscode", name: "Multi-Language" };
}

function getGitInfo(dir) {
    try {
        const branch = execSync("git rev-parse --abbrev-ref HEAD", {
            cwd: dir,
            stdio: ["ignore", "pipe", "ignore"],
            timeout: 1000
        }).toString().trim();
        return branch || null;
    } catch {
        return null;
    }
}

function getGitRemoteUrl(dir) {
    try {
        let url = execSync("git config --get remote.origin.url", {
            cwd: dir,
            stdio: ["ignore", "pipe", "ignore"],
            timeout: 1000
        }).toString().trim();
        if (!url) return null;
        if (url.startsWith("git@")) {
            url = url.replace(":", "/").replace("git@", "https://");
        }
        if (url.endsWith(".git")) {
            url = url.slice(0, -4);
        }
        return url.startsWith("http") ? url : null;
    } catch {
        return null;
    }
}

function getGitDiffStats(dir) {
    try {
        const out = execSync("git diff --shortstat", {
            cwd: dir,
            stdio: ["ignore", "pipe", "ignore"],
            timeout: 1000
        }).toString().trim();
        if (!out) return null;
        const ins = out.match(/(\d+)\s+insertion/);
        const del = out.match(/(\d+)\s+deletion/);
        const plus = ins ? `+${ins[1]}` : "+0";
        const minus = del ? `-${del[1]}` : "-0";
        return `${plus} ${minus}`;
    } catch {
        return null;
    }
}

// ==========================================
// 🤖 FREEBUFF AI CODING AGENT DETECTOR
// ==========================================
function getFreebuffActivity(targetDir) {
    if (config.enableFreebuffDetection === false) return null;
    const manicodeDir = path.join(userHome, ".config", "manicode");
    if (!fs.existsSync(manicodeDir)) return null;

    try {
        let isFreebuffRunning = false;
        let freebuffOwnerPid = null;

        // Check active session PID
        const liveFiles = fs.readdirSync(manicodeDir).filter(f => f.startsWith("freebuff-live-") && f.endsWith(".json"));
        for (const lf of liveFiles) {
            try {
                const liveData = JSON.parse(fs.readFileSync(path.join(manicodeDir, lf), "utf8"));
                if (liveData && liveData.ownerPid) {
                    try {
                        process.kill(liveData.ownerPid, 0);
                        isFreebuffRunning = true;
                        freebuffOwnerPid = liveData.ownerPid;
                        break;
                    } catch {}
                }
            } catch {}
        }

        if (!isFreebuffRunning) {
            if (cachedProcessNames.has("freebuff.exe")) {
                isFreebuffRunning = true;
            }
        }

        if (!isFreebuffRunning) return null;

        const projectsDir = path.join(manicodeDir, "projects");
        let activeProjectName = "";
        let activeProjectCwd = "";
        let activePrompt = "";
        let activeTool = "";
        let activeAction = "Coding";

        if (fs.existsSync(projectsDir)) {
            const projectFolders = fs.readdirSync(projectsDir, { withFileTypes: true })
                .filter(d => d.isDirectory())
                .map(d => {
                    const p = path.join(projectsDir, d.name);
                    let mtime = 0;
                    try { mtime = fs.statSync(p).mtimeMs; } catch {}
                    return { name: d.name, path: p, mtime };
                })
                .sort((a, b) => b.mtime - a.mtime);

            if (projectFolders.length > 0) {
                const latestProj = projectFolders[0];
                activeProjectName = latestProj.name;

                const chatsDir = path.join(latestProj.path, "chats");
                if (fs.existsSync(chatsDir)) {
                    const chatFolders = fs.readdirSync(chatsDir, { withFileTypes: true })
                        .filter(d => d.isDirectory())
                        .map(d => {
                            const p = path.join(chatsDir, d.name);
                            let mtime = 0;
                            try { mtime = fs.statSync(p).mtimeMs; } catch {}
                            return { name: d.name, path: p, mtime };
                        })
                        .sort((a, b) => b.mtime - a.mtime);

                    if (chatFolders.length > 0) {
                        const latestChat = chatFolders[0].path;

                        // run-state.json holds projectRoot & cwd
                        const runStatePath = path.join(latestChat, "run-state.json");
                        if (fs.existsSync(runStatePath)) {
                            try {
                                const stat = fs.statSync(runStatePath);
                                const readSize = Math.min(stat.size, 4096);
                                const buf = Buffer.alloc(readSize);
                                const fd = fs.openSync(runStatePath, "r");
                                fs.readSync(fd, buf, 0, readSize, 0);
                                fs.closeSync(fd);
                                const text = buf.toString("utf8");
                                const cwdMatch = text.match(/"cwd":"([^"]+)"/);
                                if (cwdMatch) {
                                    activeProjectCwd = cwdMatch[1].replace(/\\\\/g, "\\");
                                }
                            } catch {}
                        }

                        // chat-meta.json holds firstPrompt
                        const metaPath = path.join(latestChat, "chat-meta.json");
                        if (fs.existsSync(metaPath)) {
                            try {
                                const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
                                if (meta.firstPrompt) {
                                    activePrompt = meta.firstPrompt.trim();
                                }
                            } catch {}
                        }

                        // chat-messages.json holds latest tool calls
                        const msgPath = path.join(latestChat, "chat-messages.json");
                        if (fs.existsSync(msgPath)) {
                            try {
                                const stat = fs.statSync(msgPath);
                                const readSize = Math.min(stat.size, 8192);
                                const buf = Buffer.alloc(readSize);
                                const fd = fs.openSync(msgPath, "r");
                                fs.readSync(fd, buf, 0, readSize, stat.size - readSize);
                                fs.closeSync(fd);
                                const snippet = buf.toString("utf8");
                                const toolMatch = snippet.match(/"toolName":"([^"]+)"/g);
                                if (toolMatch) {
                                    const lastTool = toolMatch[toolMatch.length - 1].replace(/"toolName":"|"/g, "");
                                    activeTool = lastTool;
                                    if (lastTool === "edit_file" || lastTool === "write_file") activeAction = "Writing";
                                    else if (lastTool === "read_files" || lastTool === "read_file") activeAction = "Inspecting";
                                    else if (lastTool === "run_command") activeAction = "Executing";
                                    else if (lastTool === "spawn_agents" || lastTool === "researcher-web") activeAction = "Researching";
                                }
                            } catch {}
                        }
                    }
                }
            }
        }

        // Fallback prompt from message-history.json
        if (!activePrompt) {
            const histPath = path.join(manicodeDir, "message-history.json");
            if (fs.existsSync(histPath)) {
                try {
                    const hist = JSON.parse(fs.readFileSync(histPath, "utf8"));
                    if (Array.isArray(hist) && hist.length > 0) {
                        const nonCmd = hist.filter(h => typeof h === "string" && !h.startsWith("/"));
                        if (nonCmd.length > 0) {
                            activePrompt = nonCmd[nonCmd.length - 1].trim();
                        }
                    }
                } catch {}
            }
        }

        if (activePrompt) {
            activePrompt = activePrompt
                .replace(/<[^>]*>/g, "")
                .replace(/\r?\n/g, " ")
                .replace(/\s+/g, " ")
                .trim();
            if (activePrompt.length > 42) {
                activePrompt = activePrompt.slice(0, 39) + "...";
            }
        }

        return {
            agent: "Freebuff",
            isFreebuff: true,
            projectName: activeProjectName || "Coding Project",
            projectCwd: activeProjectCwd,
            prompt: activePrompt,
            action: activeAction,
            tool: activeTool,
            pid: freebuffOwnerPid
        };
    } catch {}
    return null;
}

// ==========================================
// 🧠 ANTIGRAVITY AGENT ACTIVITY DETECTOR
// ==========================================
function getAntigravityActivity() {
    if (config.enableAgentDetection === false) return null;
    const brainDir = path.join(userHome, ".gemini", "antigravity-cli", "brain");
    if (!fs.existsSync(brainDir)) return null;

    try {
        const entries = fs.readdirSync(brainDir, { withFileTypes: true })
            .filter(d => d.isDirectory() && d.name !== "scratch")
            .map(d => {
                const p = path.join(brainDir, d.name);
                return { path: p, time: fs.statSync(p).mtimeMs };
            })
            .sort((a, b) => b.time - a.time);

        if (entries.length === 0) return null;
        const transcriptPath = path.join(entries[0].path, ".system_generated", "logs", "transcript.jsonl");
        if (!fs.existsSync(transcriptPath)) return null;

        const stat = fs.statSync(transcriptPath);
        if (stat.size === 0 || Date.now() - stat.mtimeMs > 180000) return null;

        const readSize = Math.min(stat.size, 4096);
        const buf = Buffer.alloc(readSize);
        const fd = fs.openSync(transcriptPath, "r");
        fs.readSync(fd, buf, 0, readSize, stat.size - readSize);
        fs.closeSync(fd);

        const lines = buf.toString("utf8").trim().split("\n");
        const lastLine = lines[lines.length - 1];
        const item = JSON.parse(lastLine);

        if (item.type === "PLANNER_RESPONSE" && item.tool_calls && item.tool_calls.length > 0) {
            const tool = item.tool_calls[0];
            if (tool.name === "edit_file" || tool.name === "write_file") {
                const target = cleanStr(path.basename(cleanStr(tool.args?.Path) || "code"));
                const ext = path.extname(target).slice(1).toLowerCase();
                return { action: "Writing", target, ext, agent: "Antigravity" };
            } else if (tool.name === "run_command") {
                const summary = cleanStr(tool.args?.toolSummary) || "Terminal Task";
                return { action: "Executing", target: summary, agent: "Antigravity" };
            } else if (tool.name === "search_web") {
                const query = cleanStr(tool.args?.query).slice(0, 30);
                return { action: "Researching", target: query, agent: "Antigravity" };
            } else if (tool.name === "read_file") {
                const target = cleanStr(path.basename(cleanStr(tool.args?.Path) || ""));
                const ext = path.extname(target).slice(1).toLowerCase();
                return { action: "Inspecting", target, ext, agent: "Antigravity" };
            }
        } else if (item.type === "USER_INPUT") {
            return { action: "Architecting", target: "Planning Solution", agent: "Antigravity" };
        }
    } catch {}
    return null;
}

// ==========================================
// 🤖 OTHER AI CODING AGENTS (Claude, Cursor, Aider, etc.)
// ==========================================
function getOtherAiAgentActivity() {
    if (config.enableAgentDetection === false) return null;
    const p = cachedProcessNames;

    if (p.has("claude.exe") || p.has("claude")) {
        return { agent: "Claude Code", name: "Claude Code" };
    }
    if (p.has("cursor.exe") || p.has("cursor-agent.exe") || p.has("cursor-agent")) {
        return { agent: "Cursor Agent", name: "Cursor Agent" };
    }
    if (p.has("aider.exe") || p.has("aider")) {
        return { agent: "Aider", name: "Aider AI" };
    }
    if (p.has("gemini.exe") || p.has("gemini")) {
        return { agent: "Gemini CLI", name: "Gemini CLI" };
    }
    if (p.has("opencode.exe") || p.has("opencode")) {
        return { agent: "OpenCode", name: "OpenCode" };
    }
    if (p.has("codex.exe") || p.has("codex")) {
        return { agent: "Codex CLI", name: "Codex CLI" };
    }
    if (p.has("copilot.exe") || p.has("github-copilot-cli.exe")) {
        return { agent: "Copilot", name: "GitHub Copilot" };
    }
    if (p.has("goose.exe") || p.has("goose")) {
        return { agent: "Goose AI", name: "Goose AI" };
    }
    if (p.has("ollama.exe") || p.has("ollama")) {
        return { agent: "Ollama", name: "Ollama LLM" };
    }
    return null;
}

// ==========================================
// 💻 TERMINAL TEXT EDITORS (Neovim, Helix, Vim, etc.)
// ==========================================
function getActiveTerminalEditor() {
    const p = cachedProcessNames;
    if (p.has("nvim.exe") || p.has("nvim")) return "Neovim";
    if (p.has("vim.exe") || p.has("vim")) return "Vim";
    if (p.has("helix.exe") || p.has("helix") || p.has("hlx.exe") || p.has("hlx")) return "Helix";
    if (p.has("micro.exe") || p.has("micro")) return "Micro";
    if (p.has("nano.exe") || p.has("nano")) return "Nano";
    if (p.has("emacs.exe") || p.has("emacs")) return "Emacs";
    return null;
}

// ==========================================
// ⚙️ DEV CLI TOOLS & COMPILERS (Cargo, Bun, Docker, etc.)
// ==========================================
function getActiveDevCli() {
    if (config.enableCliDetection === false) return null;
    const p = cachedProcessNames;
    if (p.has("cargo.exe") || p.has("cargo") || p.has("rustc.exe")) return { name: "Cargo", lang: "Rust" };
    if (p.has("bun.exe") || p.has("bun")) return { name: "Bun", lang: "JavaScript" };
    if (p.has("deno.exe") || p.has("deno")) return { name: "Deno", lang: "TypeScript" };
    if (p.has("docker.exe") || p.has("docker")) return { name: "Docker", lang: "DevOps" };
    if (p.has("kubectl.exe") || p.has("kubectl")) return { name: "Kubernetes", lang: "DevOps" };
    if (p.has("git.exe")) return { name: "Git", lang: "Version Control" };
    if (p.has("go.exe") || p.has("go")) return { name: "Go CLI", lang: "Go" };
    if (p.has("python.exe") || p.has("python3.exe") || p.has("py.exe")) return { name: "Python", lang: "Python" };
    return null;
}

// ==========================================
// 💻 TERMINAL SHELLS
// ==========================================
function getActiveShell() {
    if (config.enableCliDetection === false) return null;
    const p = cachedProcessNames;
    if (p.has("windowsterminal.exe")) return "Windows Terminal";
    if (p.has("pwsh.exe")) return "PowerShell 7";
    if (p.has("powershell.exe")) return "PowerShell";
    if (p.has("cmd.exe")) return "Command Prompt";
    if (p.has("wsl.exe") || p.has("bash.exe")) return "Bash / WSL";
    if (p.has("nu.exe")) return "Nushell";
    if (p.has("fish.exe")) return "Fish Shell";
    return null;
}

function getRecentlyModifiedWorkspaceFile(dir) {
    try {
        const out = execSync("git status --porcelain -u", {
            cwd: dir,
            stdio: ["ignore", "pipe", "ignore"],
            timeout: 1000
        }).toString().trim();
        if (!out) return null;

        const files = out.split("\n").map(l => l.trim().slice(3).replace(/"/g, "")).filter(Boolean);
        let newest = null;
        let newestTime = 0;
        const now = Date.now();

        for (const f of files) {
            const fullPath = path.isAbsolute(f) ? f : path.join(dir, f);
            if (fs.existsSync(fullPath)) {
                const mtime = fs.statSync(fullPath).mtimeMs;
                if (mtime > newestTime) {
                    newestTime = mtime;
                    newest = f;
                }
            }
        }

        if (newest && (now - newestTime < 180000)) {
            const base = path.basename(newest);
            return { file: base, ext: path.extname(base).slice(1).toLowerCase(), totalDirty: files.length };
        }
        return { totalDirty: files.length };
    } catch {
        return null;
    }
}

function getIpcPath(index = 0) {
    if (process.platform === "win32") {
        return `\\\\.\\pipe\\discord-ipc-${index}`;
    }
    const env = process.env;
    const prefix = env.XDG_RUNTIME_DIR || 
                   env.TMPDIR || 
                   env.TMP || 
                   env.TEMP || 
                   (process.getuid ? `/run/user/${process.getuid()}` : null) || 
                   "/tmp";
    return path.join(prefix, `discord-ipc-${index}`);
}

let socket = null;
let updateInterval = null;

function connect(pipeIndex = 0) {
    if (pipeIndex > 9) {
        setTimeout(() => connect(0), 10000);
        return;
    }

    const rbxInfo = getRobloxStudioInfo(targetDir);
    activeClientId = getActiveClientId(rbxInfo);

    const pipePath = getIpcPath(pipeIndex);
    const s = net.connect(pipePath, () => {
        socket = s;
        const payload = Buffer.from(JSON.stringify({ v: 1, client_id: activeClientId }));
        const header = Buffer.alloc(8);
        header.writeInt32LE(0, 0); // HANDSHAKE
        header.writeInt32LE(payload.length, 4);
        socket.write(Buffer.concat([header, payload]));
    });

    s.on("data", (data) => {
        try {
            const op = data.readInt32LE(0);
            const len = data.readInt32LE(4);
            const body = JSON.parse(data.subarray(8, 8 + len).toString());

            if (body.cmd === "DISPATCH" && body.evt === "READY") {
                updatePresence();
                if (!updateInterval) {
                    updateInterval = setInterval(updatePresence, 5000);
                }
            }
        } catch {}
    });

    s.on("error", () => {
        s.destroy();
        if (socket === s) socket = null;
        connect(pipeIndex + 1);
    });

    s.on("close", () => {
        if (socket === s) {
            socket = null;
            if (updateInterval) {
                clearInterval(updateInterval);
                updateInterval = null;
            }
            setTimeout(() => connect(0), 10000);
        }
    });
}

function updatePresence() {
    if (!socket || socket.destroyed) return;

    // Refresh background process cache
    refreshProcessListAsync();

    config = loadConfig();
    const t = TEMPLATES[config.theme] || TEMPLATES.thai;
    const userTag = config.username;

    // Active Activity Detectors
    const freebuff = getFreebuffActivity(targetDir);
    const agyAgent = getAntigravityActivity();
    const otherAgent = getOtherAiAgentActivity();
    const activeEditor = getActiveTerminalEditor();
    const devCli = getActiveDevCli();
    const activeShell = getActiveShell();

    // Dynamically sync effective directory with active Freebuff project
    let effectiveDir = targetDir;
    if (freebuff && freebuff.projectCwd && fs.existsSync(freebuff.projectCwd)) {
        effectiveDir = freebuff.projectCwd;
    }

    const rawFolderName = path.basename(effectiveDir) || "Workspace";
    const isUserHome = Boolean(userHome && path.resolve(effectiveDir).toLowerCase() === path.resolve(userHome).toLowerCase());
    const isSameName = Boolean(rawFolderName.toLowerCase() === (userTag || "").toLowerCase());

    let cleanFolder = rawFolderName;
    if (isUserHome || isSameName) {
        cleanFolder = config.theme === "thai" ? "เทอร์มินัล" : (config.theme === "cozy" ? "ห้องทำงาน" : "Terminal");
    }
    const folderName = cleanFolder;

    const branch = getGitInfo(effectiveDir);
    const rbxInfo = getRobloxStudioInfo(effectiveDir);
    const projLang = detectProjectLanguage(effectiveDir);
    const wsMod = getRecentlyModifiedWorkspaceFile(effectiveDir);
    const diffStats = config.showGitStats ? getGitDiffStats(effectiveDir) : null;

    // Track active changes for AFK calculation
    const currentActivityKey = (freebuff ? `fb:${freebuff.projectName}:${freebuff.prompt}` : "") +
                               (agyAgent ? `agy:${agyAgent.action}:${agyAgent.target}` : "") +
                               (wsMod?.file || "") +
                               (activeEditor || "") +
                               (devCli?.name || "");

    if (currentActivityKey && currentActivityKey !== lastTrackedTarget) {
        lastActivityTime = Date.now();
        lastTrackedTarget = currentActivityKey;
    }

    const afkLimitMs = (config.afkTimeoutMinutes || 5) * 60 * 1000;
    const isAfk = Date.now() - lastActivityTime > afkLimitMs;

    let details = "";
    let largeImage = projLang.icon || "vscode";
    let largeText = `${projLang.name} • ${userTag}`;
    let smallImage = "vscode";
    let smallText = `👤 ${userTag} • Zircord`;

    if (rbxInfo) {
        largeImage = "lua";
        largeText = `Roblox Studio • ${rbxInfo.placeTitle}`;
        smallImage = "vscode";
        smallText = rbxInfo.hasRojo ? "Rojo Synced" : "Roblox Studio";
    }

    const gitContext = t.gitFormat(branch, wsMod?.totalDirty, diffStats);
    const displayFolder = rbxInfo ? rbxInfo.placeTitle : (freebuff ? freebuff.projectName : folderName);
    let state = t.state(userTag, displayFolder, gitContext, Boolean(rbxInfo));

    if (isAfk) {
        details = t.afkDetails();
        state = t.afkState(userTag);
        largeImage = "idle";
        largeText = `AFK (${config.afkTimeoutMinutes}m) • ${userTag}`;
    } else if (freebuff) {
        details = t.freebuff(freebuff.projectName, freebuff.prompt, freebuff.action);
        largeImage = projLang.icon || "vscode";
        largeText = `Freebuff AI Agent • ${userTag}`;
        smallImage = "vscode";
        smallText = `🤖 Freebuff AI • Zircord`;
    } else if (agyAgent) {
        const lang = agyAgent.ext && LANG_MAP[agyAgent.ext] ? LANG_MAP[agyAgent.ext] : projLang;
        if (!rbxInfo) {
            largeImage = lang.icon || "vscode";
            largeText = `${lang.name} • ${userTag}`;
        }

        let subType = agyAgent.ext === "luau" || agyAgent.ext === "lua" ? getLuauScriptSubtype(agyAgent.target) : "";
        if (activeEditor) subType = subType ? `${subType} • ${activeEditor}` : activeEditor;

        if (agyAgent.action === "Writing") {
            details = t.writing(lang.name, agyAgent.target, subType);
        } else if (agyAgent.action === "Inspecting") {
            details = t.reading(lang.name, agyAgent.target, subType);
        } else if (agyAgent.action === "Executing") {
            details = t.running(agyAgent.target);
        } else if (agyAgent.action === "Researching") {
            details = t.searching(agyAgent.target);
        } else {
            details = t.planning(agyAgent.target);
        }
    } else if (otherAgent) {
        details = t.aiAgent(otherAgent.name, folderName, "");
        largeImage = projLang.icon || "vscode";
        largeText = `${otherAgent.name} • ${userTag}`;
        smallImage = "vscode";
        smallText = `🤖 ${otherAgent.name} • Zircord`;
    } else if (activeEditor && wsMod && wsMod.file) {
        const lang = wsMod.ext && LANG_MAP[wsMod.ext] ? LANG_MAP[wsMod.ext] : projLang;
        details = t.cliEditor(activeEditor, wsMod.file, folderName);
        largeImage = lang.icon || "vscode";
        largeText = `${lang.name} • ${activeEditor}`;
    } else if (wsMod && wsMod.file) {
        const lang = wsMod.ext && LANG_MAP[wsMod.ext] ? LANG_MAP[wsMod.ext] : projLang;
        if (!rbxInfo) {
            largeImage = lang.icon || "vscode";
            largeText = `${lang.name} • ${userTag}`;
        }
        let subType = wsMod.ext === "luau" || wsMod.ext === "lua" ? getLuauScriptSubtype(wsMod.file) : "";
        if (activeEditor) subType = subType ? `${subType} • ${activeEditor}` : activeEditor;
        details = t.writing(lang.name, wsMod.file, subType);
    } else if (activeEditor) {
        details = t.cliEditor(activeEditor, "", folderName);
        largeImage = projLang.icon || "vscode";
        largeText = `${activeEditor} • ${userTag}`;
    } else if (devCli) {
        details = t.cliTool(devCli.name, folderName, devCli.lang);
        largeImage = projLang.icon || "vscode";
        largeText = `${devCli.name} • ${userTag}`;
    } else if (activeShell) {
        details = t.cliShell(activeShell, folderName);
        largeImage = "shell";
        largeText = `${activeShell} • ${userTag}`;
    } else {
        if (rbxInfo) {
            details = t.idleRoblox(rbxInfo.placeTitle);
        } else if (projLang.name !== "Multi-Language") {
            details = t.idleLang(projLang.name);
        } else {
            details = t.idleGeneric(folderName);
        }
    }

    const buttons = [];
    if (config.showButtons) {
        // 1. Custom buttons from config (up to 2)
        if (Array.isArray(config.buttons) && config.buttons.length > 0) {
            for (const btn of config.buttons) {
                if (btn && btn.label && btn.url && typeof btn.url === "string" && btn.url.startsWith("http")) {
                    buttons.push({
                        label: String(btn.label).slice(0, 32),
                        url: String(btn.url).slice(0, 512)
                    });
                    if (buttons.length === 2) break;
                }
            }
        }

        // 2. Ensure exactly 2 buttons in 100% Thai
        if (buttons.length < 2) {
            const remoteUrl = getGitRemoteUrl(effectiveDir);
            const fallbackProfileUrl = config.profileUrl || "https://github.com/ZXD44";
            const zircordRepoUrl = "https://github.com/ZXD44/Zircord";

            if (buttons.length === 0) {
                if (remoteUrl) {
                    buttons.push({
                        label: "ดูโค้ดบน GitHub",
                        url: remoteUrl
                    });
                    buttons.push({
                        label: `โปรไฟล์ ${userTag}`.slice(0, 32),
                        url: fallbackProfileUrl
                    });
                } else {
                    buttons.push({
                        label: `โปรไฟล์ ${userTag}`.slice(0, 32),
                        url: fallbackProfileUrl
                    });
                    buttons.push({
                        label: "โปรเจกต์ Zircord",
                        url: zircordRepoUrl
                    });
                }
            } else if (buttons.length === 1) {
                const firstUrl = buttons[0].url;
                if (firstUrl !== fallbackProfileUrl) {
                    buttons.push({
                        label: `โปรไฟล์ ${userTag}`.slice(0, 32),
                        url: fallbackProfileUrl
                    });
                } else {
                    buttons.push({
                        label: "โปรเจกต์ Zircord",
                        url: zircordRepoUrl
                    });
                }
            }
        }
    }

    const activity = {
        details,
        state,
        timestamps: {
            start: startTimestamp
        },
        assets: {
            large_image: largeImage,
            large_text: largeText,
            small_image: smallImage,
            small_text: smallText
        },
        instance: false
    };

    if (buttons.length > 0) {
        activity.buttons = buttons;
    }

    const payload = Buffer.from(JSON.stringify({
        cmd: "SET_ACTIVITY",
        args: {
            pid: process.pid,
            activity: activity
        },
        nonce: Math.random().toString(36).substring(2)
    }));

    const header = Buffer.alloc(8);
    header.writeInt32LE(1, 0); // Opcode 1: FRAME
    header.writeInt32LE(payload.length, 4);
    socket.write(Buffer.concat([header, payload]));
}

connect(0);
