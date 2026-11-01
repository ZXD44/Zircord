const net = require("net");
const path = require("path");
const fs = require("fs");
const { execSync, spawn } = require("child_process");

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
    // Dynamic defaults for ANY user on ANY machine
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
// 🕹️ CLI DAEMON CONTROL (start / stop / status)
// ==========================================
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
            console.log(`  ● Daemon:    RUNNING (PID: ${pid})`);
            console.log(`  ● Directory: ${dir || process.cwd()}`);
            console.log(`  ● Theme:     ${config.theme}`);
            console.log(`  ● User:      ${config.username}`);
        } else {
            console.log("  ○ Daemon:    STOPPED");
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
            const psCmd = `Start-Process -FilePath 'node' -ArgumentList @('${escapedScript}', '${escapedTarget}') -WorkingDirectory '${escapedTarget}' -WindowStyle Hidden`;
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

    if (cmd === "--help" || cmd === "-h" || cmd === "help") {
        console.log(`
🌌 Zircord - Intelligent Discord Rich Presence for Terminal & Any CLI

Usage:
  zircord [path]        Run Zircord monitoring current or target folder
  zircord start [path]  Start Zircord daemon in background
  zircord stop          Stop all running Zircord daemon processes
  zircord status        Show running daemon status
  zircord --help        Show this help message

Aliases:
  clicord (backward-compatible)

Configuration:
  zircord.json (in current directory or ~/.gemini/zircord.json)
`);
        process.exit(0);
    }
}

handleCliCommands();

// Default Application IDs:
// - "383226320970055681" -> "Playing Visual Studio Code"
// - "1199942284653903882" -> "Playing Roblox Studio"
// - Custom ID in clicord.json -> "Playing <Your Custom App Name>"
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

    // 1. Universal Process Check (Standard Roblox, Bloxstrap, Fishstrap)
    try {
        const out = execSync('tasklist /FI "IMAGENAME eq RobloxStudioBeta.exe" /FI "IMAGENAME eq RobloxStudio.exe" /NH', {
            stdio: ["ignore", "pipe", "ignore"],
            timeout: 2000
        }).toString();
        if (out.includes("RobloxStudioBeta.exe") || out.includes("RobloxStudio.exe")) {
            studioRunning = true;
        }
    } catch {}

    // 2. Universal Rojo project config (default.project.json)
    let rojoProjectName = null;
    try {
        const defaultProj = path.join(target, "default.project.json");
        if (fs.existsSync(defaultProj)) {
            const data = JSON.parse(fs.readFileSync(defaultProj, "utf8"));
            rojoProjectName = data.name || null;
        }
    } catch {}

    // 3. Universal Roblox files detection (.rbxl, .rbxlx, wally, rokit, aftman)
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

    // 4. Universal log scanner: check both Roblox\logs and Bloxstrap\Logs for ANY user
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

function getAgentActivity() {
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
                return { action: "Writing", target, ext };
            } else if (tool.name === "run_command") {
                const summary = cleanStr(tool.args?.toolSummary) || "Terminal Task";
                return { action: "Executing", target: summary };
            } else if (tool.name === "search_web") {
                const query = cleanStr(tool.args?.query).slice(0, 30);
                return { action: "Researching", target: query };
            } else if (tool.name === "read_file") {
                const target = cleanStr(path.basename(cleanStr(tool.args?.Path) || ""));
                const ext = path.extname(target).slice(1).toLowerCase();
                return { action: "Inspecting", target, ext };
            }
        } else if (item.type === "USER_INPUT") {
            return { action: "Architecting", target: "Planning Solution" };
        }
    } catch {}
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

function getActiveTerminalEditor() {
    try {
        if (process.platform === "win32") {
            const out = execSync("tasklist /NH /FO CSV", { encoding: "utf8", timeout: 800 });
            if (/nvim\.exe/i.test(out)) return "Neovim";
            if (/vim\.exe/i.test(out)) return "Vim";
            if (/helix\.exe/i.test(out)) return "Helix";
            if (/micro\.exe/i.test(out)) return "Micro";
            if (/nano\.exe/i.test(out)) return "Nano";
        } else {
            const out = execSync("ps -A -o comm=", { encoding: "utf8", timeout: 800 });
            if (/\bnvim\b/i.test(out)) return "Neovim";
            if (/\bvim\b/i.test(out)) return "Vim";
            if (/\bhlx\b|\bhelix\b/i.test(out)) return "Helix";
            if (/\bmicro\b/i.test(out)) return "Micro";
            if (/\bnano\b/i.test(out)) return "Nano";
        }
    } catch {}
    return null;
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

    config = loadConfig();
    const t = TEMPLATES[config.theme] || TEMPLATES.thai;
    const userTag = config.username;
    const rawFolderName = path.basename(targetDir) || "Workspace";
    const isUserHome = Boolean(userHome && path.resolve(targetDir).toLowerCase() === path.resolve(userHome).toLowerCase());
    const isSameName = Boolean(rawFolderName.toLowerCase() === (userTag || "").toLowerCase());

    let cleanFolder = rawFolderName;
    if (isUserHome || isSameName) {
        cleanFolder = config.theme === "thai" ? "เทอร์มินัล" : (config.theme === "cozy" ? "ห้องทำงาน" : "Terminal");
    }
    const folderName = cleanFolder;

    const branch = getGitInfo(targetDir);
    const rbxInfo = getRobloxStudioInfo(targetDir);
    const projLang = detectProjectLanguage(targetDir);
    const agent = getAgentActivity();
    const wsMod = getRecentlyModifiedWorkspaceFile(targetDir);
    const diffStats = config.showGitStats ? getGitDiffStats(targetDir) : null;
    const activeEditor = getActiveTerminalEditor();

    // Track active changes for AFK calculation
    const currentActivityKey = (agent ? `${agent.action}:${agent.target}` : "") + (wsMod?.file || "") + (activeEditor || "");
    if (currentActivityKey && currentActivityKey !== lastTrackedTarget) {
        lastActivityTime = Date.now();
        lastTrackedTarget = currentActivityKey;
    }

    const afkLimitMs = (config.afkTimeoutMinutes || 5) * 60 * 1000;
    const isAfk = Date.now() - lastActivityTime > afkLimitMs;

    let details = "";
    let largeImage = projLang.icon;
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
    const displayFolder = rbxInfo ? rbxInfo.placeTitle : folderName;
    let state = t.state(userTag, displayFolder, gitContext, Boolean(rbxInfo));

    if (isAfk) {
        details = t.afkDetails();
        state = t.afkState(userTag);
        largeImage = "idle";
        largeText = `AFK (${config.afkTimeoutMinutes}m) • ${userTag}`;
    } else if (agent) {
        const lang = agent.ext && LANG_MAP[agent.ext] ? LANG_MAP[agent.ext] : projLang;
        if (!rbxInfo) {
            largeImage = lang.icon;
            largeText = `${lang.name} • ${userTag}`;
        }

        let subType = agent.ext === "luau" || agent.ext === "lua" ? getLuauScriptSubtype(agent.target) : "";
        if (activeEditor) subType = subType ? `${subType} • ${activeEditor}` : activeEditor;

        if (agent.action === "Writing") {
            details = t.writing(lang.name, agent.target, subType);
        } else if (agent.action === "Inspecting") {
            details = t.reading(lang.name, agent.target, subType);
        } else if (agent.action === "Executing") {
            details = t.running(agent.target);
        } else if (agent.action === "Researching") {
            details = t.searching(agent.target);
        } else {
            details = t.planning(agent.target);
        }
    } else if (wsMod && wsMod.file) {
        const lang = wsMod.ext && LANG_MAP[wsMod.ext] ? LANG_MAP[wsMod.ext] : projLang;
        if (!rbxInfo) {
            largeImage = lang.icon;
            largeText = `${lang.name} • ${userTag}`;
        }
        let subType = wsMod.ext === "luau" || wsMod.ext === "lua" ? getLuauScriptSubtype(wsMod.file) : "";
        if (activeEditor) subType = subType ? `${subType} • ${activeEditor}` : activeEditor;
        details = t.writing(lang.name, wsMod.file, subType);
    } else {
        if (rbxInfo) {
            details = t.idleRoblox(rbxInfo.placeTitle);
        } else if (activeEditor) {
            details = `🔥 ${activeEditor} :: ${folderName}`;
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
            const remoteUrl = getGitRemoteUrl(targetDir);
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
