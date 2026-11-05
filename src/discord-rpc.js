/**
 * 💎 Zircord - Universal Discord Rich Presence for Developers, CLIs, AI Agents & Roblox
 * Inspired by LeonardSSH/vscord (https://open-vsx.org/extension/LeonardSSH/vscord)
 * Ultra-optimized, zero-fluff, robust IPC engine by ZirconX
 */

const net = require("net");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { execFileSync, execFile, spawn } = require("child_process");

// ============================================================================
// ⚙️ CONSTANTS & PLATFORM ENVIRONMENT
// ============================================================================
const IS_WIN = process.platform === "win32";
const USER_HOME = process.env.USERPROFILE || process.env.HOME || os.homedir() || "";
const LOCAL_APPDATA = process.env.LOCALAPPDATA || path.join(USER_HOME, "AppData", "Local");
const VSCODE_CLIENT_ID = "383226320970055681";
const ROBLOX_CLIENT_ID = "1199942284653903882";
const PID_FILE = path.join(USER_HOME, ".gemini", "zircord.pid");

// ============================================================================
// 🛡️ SAFE CHILD PROCESS & STRING WRAPPERS (ZERO CONSOLE POPUP)
// ============================================================================
function safeExecSync(file, args = [], opts = {}) {
    try {
        return execFileSync(file, args, {
            encoding: "utf8",
            timeout: 2500,
            windowsHide: true,
            stdio: ["ignore", "pipe", "ignore"],
            ...opts
        }).trim();
    } catch {
        return "";
    }
}

function truncateUtf8(str, maxBytes = 128) {
    if (!str) return "";
    const buf = Buffer.from(String(str), "utf8");
    if (buf.length <= maxBytes) return String(str);
    let end = maxBytes;
    while (end > 0 && (buf[end] & 0xc0) === 0x80) end--;
    return buf.subarray(0, end).toString("utf8");
}

// ============================================================================
// 🎨 VSCORD ASSET & LANGUAGE MAP
// ============================================================================
const LANG_MAP = {
    js: { icon: "javascript", name: "JavaScript" },
    mjs: { icon: "javascript", name: "JavaScript" },
    cjs: { icon: "javascript", name: "JavaScript" },
    jsx: { icon: "react", name: "React JSX" },
    ts: { icon: "typescript", name: "TypeScript" },
    tsx: { icon: "react_ts", name: "React TSX" },
    py: { icon: "python", name: "Python" },
    pyw: { icon: "python", name: "Python" },
    lua: { icon: "lua", name: "Luau" },
    luau: { icon: "lua", name: "Luau" },
    rs: { icon: "rust", name: "Rust" },
    go: { icon: "go", name: "Go" },
    c: { icon: "c", name: "C" },
    h: { icon: "c", name: "C Header" },
    cpp: { icon: "cpp", name: "C++" },
    hpp: { icon: "cpp", name: "C++ Header" },
    cs: { icon: "csharp", name: "C#" },
    html: { icon: "html", name: "HTML" },
    css: { icon: "css", name: "CSS" },
    scss: { icon: "sass", name: "SCSS" },
    sass: { icon: "sass", name: "Sass" },
    less: { icon: "less", name: "Less" },
    json: { icon: "json", name: "JSON" },
    jsonc: { icon: "json", name: "JSON" },
    md: { icon: "markdown", name: "Markdown" },
    markdown: { icon: "markdown", name: "Markdown" },
    yaml: { icon: "yaml", name: "YAML" },
    yml: { icon: "yaml", name: "YAML" },
    toml: { icon: "toml", name: "TOML" },
    sql: { icon: "sql", name: "SQL" },
    sh: { icon: "shell", name: "Shell Script" },
    bash: { icon: "shell", name: "Bash" },
    zsh: { icon: "shell", name: "Zsh" },
    ps1: { icon: "powershell", name: "PowerShell" },
    dockerfile: { icon: "docker", name: "Dockerfile" },
    docker: { icon: "docker", name: "Docker" },
    vue: { icon: "vue", name: "Vue" },
    java: { icon: "java", name: "Java" },
    kt: { icon: "kotlin", name: "Kotlin" },
    kts: { icon: "kotlin", name: "Kotlin Script" },
    swift: { icon: "swift", name: "Swift" },
    dart: { icon: "dart", name: "Dart" },
    rb: { icon: "ruby", name: "Ruby" },
    php: { icon: "php", name: "PHP" }
};

// ============================================================================
// 📁 CONFIGURATION LOADER
// ============================================================================
function loadConfig(startDir) {
    const defaults = {
        theme: "vscord",
        username: process.env.ZIRCORD_USER || process.env.USERNAME || "Developer",
        appName: "Visual Studio Code",
        afkTimeoutMinutes: 5,
        showButtons: true,
        profileUrl: "https://github.com/ZXD44",
        showGitStats: true,
        enableRobloxDetection: true,
        enableFreebuffDetection: true,
        enableKiroDetection: true,
        enableAgentDetection: true,
        enableCliDetection: true,
        clientId: ""
    };

    const candidateFiles = [
        path.join(startDir || process.cwd(), "zircord.json"),
        path.join(USER_HOME, ".gemini", "zircord.json"),
        path.join(USER_HOME, ".gemini", "clicord.json")
    ];

    for (const file of candidateFiles) {
        if (fs.existsSync(file)) {
            try {
                const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
                return { ...defaults, ...parsed };
            } catch {}
        }
    }
    return defaults;
}

// ============================================================================
// 🔒 SINGLE-INSTANCE MUTEX CONTROLLER
// ============================================================================
function enforceSingleInstance(targetDir) {
    try {
        if (fs.existsSync(PID_FILE)) {
            const data = JSON.parse(fs.readFileSync(PID_FILE, "utf8"));
            if (data && data.pid && data.pid !== process.pid) {
                try {
                    process.kill(data.pid, 0); // Check if alive
                    process.kill(data.pid);    // Terminate old daemon
                } catch {}
            }
        }
    } catch {}

    try {
        fs.mkdirSync(path.dirname(PID_FILE), { recursive: true });
        fs.writeFileSync(PID_FILE, JSON.stringify({
            pid: process.pid,
            targetDir: targetDir || process.cwd(),
            startedAt: new Date().toISOString()
        }));
    } catch {}

    process.on("exit", () => {
        try {
            if (fs.existsSync(PID_FILE)) {
                const data = JSON.parse(fs.readFileSync(PID_FILE, "utf8"));
                if (data && data.pid === process.pid) fs.unlinkSync(PID_FILE);
            }
        } catch {}
    });
}

// ============================================================================
// ⚡ ASYNC THROTTLED PROCESS MONITOR (ZERO CMD.EXE CALLS)
// ============================================================================
let cachedProcesses = new Set();
let lastProcessScanTime = 0;
let isScanning = false;

function refreshProcessListAsync() {
    const now = Date.now();
    if (isScanning || now - lastProcessScanTime < 12000) return;
    isScanning = true;

    if (IS_WIN) {
        execFile("tasklist.exe", ["/NH", "/FO", "CSV"], { encoding: "utf8", timeout: 4000, windowsHide: true }, (err, stdout) => {
            isScanning = false;
            lastProcessScanTime = Date.now();
            if (err || !stdout) return;
            const set = new Set();
            for (const line of stdout.split(/\r?\n/)) {
                const match = line.match(/^"([^"]+)"/);
                if (match) set.add(match[1].toLowerCase());
            }
            cachedProcesses = set;
        });
    } else {
        execFile("ps", ["-A", "-o", "comm="], { encoding: "utf8", timeout: 4000, windowsHide: true }, (err, stdout) => {
            isScanning = false;
            lastProcessScanTime = Date.now();
            if (err || !stdout) return;
            const set = new Set();
            for (const line of stdout.split("\n")) {
                const trimmed = line.trim().toLowerCase();
                if (trimmed) set.add(trimmed);
            }
            cachedProcesses = set;
        });
    }
}

// Initial sync probe
try {
    if (IS_WIN) {
        const out = execFileSync("tasklist.exe", ["/NH", "/FO", "CSV"], { encoding: "utf8", timeout: 2000, windowsHide: true });
        for (const line of out.split(/\r?\n/)) {
            const match = line.match(/^"([^"]+)"/);
            if (match) cachedProcesses.add(match[1].toLowerCase());
        }
    }
} catch {}
refreshProcessListAsync();

// ============================================================================
// 🌿 ZERO-OVERHEAD GIT ENGINE (ONLY RUNS WHEN .GIT EXISTS)
// ============================================================================
function findGitRoot(dir) {
    let curr = path.resolve(dir || process.cwd());
    while (curr) {
        if (fs.existsSync(path.join(curr, ".git"))) return curr;
        const parent = path.dirname(curr);
        if (parent === curr) break;
        curr = parent;
    }
    return null;
}

function getGitData(dir) {
    const gitRoot = findGitRoot(dir);
    if (!gitRoot) return null;

    const branch = safeExecSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd: gitRoot }) || "main";
    let remote = safeExecSync("git", ["config", "--get", "remote.origin.url"], { cwd: gitRoot });
    if (remote) {
        if (remote.startsWith("git@")) remote = remote.replace(":", "/").replace("git@", "https://");
        if (remote.endsWith(".git")) remote = remote.slice(0, -4);
        if (!remote.startsWith("http")) remote = null;
    }

    const shortstat = safeExecSync("git", ["diff", "--shortstat"], { cwd: gitRoot });
    let diff = "";
    if (shortstat) {
        const ins = shortstat.match(/(\d+)\s+insertion/);
        const del = shortstat.match(/(\d+)\s+deletion/);
        diff = `+${ins ? ins[1] : 0} -${del ? del[1] : 0}`;
    }

    return { root: gitRoot, branch, remote, diff };
}

// ============================================================================
// 📂 WORKSPACE & ACTIVE FILE DETECTOR
// ============================================================================
function getWorkspaceActivity(dir) {
    const gitRoot = findGitRoot(dir);
    const searchDir = gitRoot || dir;
    let newestFile = null;
    let newestExt = "";
    let newestMtime = 0;

    if (gitRoot) {
        const status = safeExecSync("git", ["status", "--porcelain", "-u"], { cwd: gitRoot });
        if (status) {
            for (const line of status.split(/\r?\n/)) {
                if (line.length < 4) continue;
                const file = line.slice(3).trim().replace(/^["']|["']$/g, "");
                const full = path.join(gitRoot, file);
                try {
                    const st = fs.statSync(full);
                    if (st.mtimeMs > newestMtime) {
                        newestMtime = st.mtimeMs;
                        newestFile = file;
                        newestExt = path.extname(file).slice(1).toLowerCase();
                    }
                } catch {}
            }
        }
    }

    if (!newestFile) {
        try {
            const files = fs.readdirSync(searchDir, { withFileTypes: true });
            for (const f of files) {
                if (f.isFile()) {
                    const full = path.join(searchDir, f.name);
                    const st = fs.statSync(full);
                    if (st.mtimeMs > newestMtime) {
                        newestMtime = st.mtimeMs;
                        newestFile = f.name;
                        newestExt = path.extname(f.name).slice(1).toLowerCase();
                    }
                }
            }
        } catch {}
    }

    const rawName = path.basename(searchDir) || "Workspace";
    return {
        workspaceName: rawName,
        workspaceDir: searchDir,
        activeFile: newestFile ? path.basename(newestFile) : "",
        activeExt: newestExt,
        lastModified: newestMtime
    };
}

// ============================================================================
// 🤖 AI CODING AGENT & CLI DETECTORS
// ============================================================================
function detectAiActivity(targetDir) {
    // 1. Antigravity Agent
    try {
        const brainDir = path.join(USER_HOME, ".gemini", "antigravity-cli", "brain");
        if (fs.existsSync(brainDir)) {
            const entries = fs.readdirSync(brainDir, { withFileTypes: true })
                .filter(d => d.isDirectory() && d.name !== "scratch")
                .map(d => ({ path: path.join(brainDir, d.name), time: fs.statSync(path.join(brainDir, d.name)).mtimeMs }))
                .sort((a, b) => b.time - a.time);

            if (entries.length > 0) {
                const transcript = path.join(entries[0].path, ".system_generated", "logs", "transcript.jsonl");
                if (fs.existsSync(transcript)) {
                    const st = fs.statSync(transcript);
                    if (Date.now() - st.mtimeMs < 180000) {
                        const fd = fs.openSync(transcript, "r");
                        const readSize = Math.min(st.size, 4096);
                        const buf = Buffer.alloc(readSize);
                        fs.readSync(fd, buf, 0, readSize, st.size - readSize);
                        fs.closeSync(fd);
                        const lines = buf.toString("utf8").trim().split("\n");
                        const item = JSON.parse(lines[lines.length - 1]);
                        if (item.type === "PLANNER_RESPONSE" && item.tool_calls?.[0]) {
                            const call = item.tool_calls[0];
                            const tName = call.name;
                            const target = call.args?.Path ? path.basename(call.args.Path) : (call.args?.toolSummary || "Workspace Task");
                            return { agent: "Antigravity", action: tName.includes("edit") || tName.includes("write") ? "Writing" : "Refactoring", target };
                        }
                    }
                }
            }
        }
    } catch {}

    // 2. Freebuff Agent
    try {
        const maniDir = path.join(USER_HOME, ".config", "manicode");
        if (fs.existsSync(maniDir) && cachedProcesses.has("freebuff.exe")) {
            const projDir = path.join(maniDir, "projects");
            if (fs.existsSync(projDir)) {
                const projs = fs.readdirSync(projDir, { withFileTypes: true })
                    .filter(d => d.isDirectory())
                    .map(d => ({ name: d.name, time: fs.statSync(path.join(projDir, d.name)).mtimeMs }))
                    .sort((a, b) => b.time - a.time);
                if (projs.length > 0) {
                    return { agent: "Freebuff", action: "Coding", target: projs[0].name };
                }
            }
        }
    } catch {}

    // 3. Other AI CLIs
    if (cachedProcesses.has("claude.exe") || cachedProcesses.has("claude")) return { agent: "Claude Code", action: "Assisting", target: "Workspace" };
    if (cachedProcesses.has("kiro.exe") || cachedProcesses.has("kiro-cli.exe")) return { agent: "Kiro AI", action: "Coding", target: "Workspace" };
    if (cachedProcesses.has("aider.exe") || cachedProcesses.has("aider")) return { agent: "Aider", action: "Pair Programming", target: "Workspace" };

    return null;
}

function detectRobloxStudio(targetDir) {
    const isRunning = cachedProcesses.has("robloxstudiobeta.exe") || cachedProcesses.has("robloxstudio.exe");
    if (!isRunning) return null;

    let placeTitle = "Roblox Experience";
    try {
        const defaultProj = path.join(targetDir, "default.project.json");
        if (fs.existsSync(defaultProj)) {
            const data = JSON.parse(fs.readFileSync(defaultProj, "utf8"));
            if (data.name) placeTitle = data.name;
        }
    } catch {}

    return { isRoblox: true, placeTitle };
}

function detectActiveEditor() {
    const p = cachedProcesses;
    if (p.has("nvim.exe") || p.has("nvim")) return "Neovim";
    if (p.has("vim.exe") || p.has("vim")) return "Vim";
    if (p.has("hx.exe") || p.has("hx")) return "Helix";
    if (p.has("code.exe")) return "VS Code";
    if (p.has("windowsterminal.exe")) return "Windows Terminal";
    if (p.has("pwsh.exe")) return "PowerShell 7";
    if (p.has("powershell.exe")) return "PowerShell";
    return null;
}

// ============================================================================
// 🎨 VSCORD-GRADE RICH PRESENCE BUILDER
// ============================================================================
function buildActivity(config, targetDir, startTimestamp, isAfk) {
    const ws = getWorkspaceActivity(targetDir);
    const git = config.showGitStats ? getGitData(targetDir) : null;
    const ai = config.enableAgentDetection ? detectAiActivity(targetDir) : null;
    const rbx = config.enableRobloxDetection ? detectRobloxStudio(targetDir) : null;
    const editor = detectActiveEditor();

    // Determine Language & Icon
    const fileExt = ws.activeExt;
    const langInfo = LANG_MAP[fileExt] || { icon: "vscode", name: "Text" };
    const langName = langInfo.name;
    const langIcon = langInfo.icon;

    // Theme selector
    const theme = (config.theme || "vscord").toLowerCase();
    let details = "";
    let state = "";
    let largeImage = langIcon;
    let largeText = "";
    let smallImage = "vscode";
    let smallText = config.appName || "Visual Studio Code";

    // 1. Idle / AFK Mode
    if (isAfk) {
        if (theme === "thai") {
            details = "☕ พักสายตา / AFK";
            state = `เวิร์กสเปซ: ${ws.workspaceName}`;
            largeText = "พักสายตาแป๊บเดียว";
        } else if (theme === "cyber") {
            details = "💤 [STANDBY] Node Idle";
            state = `root@${config.username} // ${ws.workspaceName}`;
            largeText = "IDLE MODE";
        } else if (theme === "cozy") {
            details = "☕ จิบชาพักผ่อน / AFK";
            state = `🌱 ใน ${ws.workspaceName}`;
            largeText = "พักผ่อนชิลล์ๆ";
        } else {
            // vscord standard
            details = "Idling";
            state = `Workspace: ${ws.workspaceName}`;
            largeText = "Idling in Workspace";
        }
        largeImage = "idle";
    }
    // 2. Roblox Studio Mode
    else if (rbx) {
        largeImage = "lua";
        smallImage = "vscode";
        if (theme === "thai") {
            details = `🎮 Roblox Studio: ${rbx.placeTitle}`;
            state = `📂 ${ws.workspaceName}${git ? ` (${git.branch})` : ""}`;
            largeText = `Roblox Studio • ${rbx.placeTitle}`;
            smallText = "Roblox Developer";
        } else {
            details = `Developing ${rbx.placeTitle}`;
            state = `Workspace: ${ws.workspaceName}${git ? ` (${git.branch})` : ""}`;
            largeText = `Roblox Studio • ${rbx.placeTitle}`;
            smallText = "Roblox Studio";
        }
    }
    // 3. AI Agent Coding Mode
    else if (ai) {
        largeImage = langIcon !== "vscode" ? langIcon : "vscode";
        largeText = `${ai.agent} Agent • ${langName}`;
        smallImage = "vscode";
        smallText = `🤖 ${ai.agent}`;

        if (theme === "thai") {
            details = `🤖 ${ai.agent}: กำลัง${ai.action === "Writing" ? "เขียนโค้ด" : ai.action} ${ai.target}`;
            state = `📂 ${ws.workspaceName}${git ? ` (${git.branch}${git.diff ? ` ✏️ ${git.diff}` : ""})` : ""}`;
        } else {
            details = `${ai.agent}: ${ai.action} ${ai.target}`;
            state = `Workspace: ${ws.workspaceName}${git ? ` (${git.branch}${git.diff ? ` [${git.diff}]` : ""})` : ""}`;
        }
    }
    // 4. File Editing Mode (1:1 Vscord Aesthetic)
    else if (ws.activeFile) {
        largeImage = langIcon;
        largeText = `Editing a ${langName} file`;

        if (editor) {
            smallImage = "vscode";
            smallText = `${editor} • ${config.username}`;
        } else {
            smallImage = "vscode";
            smallText = config.appName || "Visual Studio Code";
        }

        if (theme === "thai") {
            details = `🔥 เขียนโค้ด: ${ws.activeFile}`;
            state = `📂 ${ws.workspaceName}${git ? ` (${git.branch}${git.diff ? ` ✏️ ${git.diff}` : ""})` : ""}`;
            largeText = `${langName} • ${config.username}`;
        } else if (theme === "cyber") {
            details = `⚡ [DEV] ${langName} // ${ws.activeFile}`;
            state = `root@${config.username} // ${ws.workspaceName}${git ? ` [git:${git.branch}${git.diff ? ` diff:${git.diff}` : ""}]` : ""}`;
            largeText = `[ONLINE] ${langName} Node`;
        } else if (theme === "cozy") {
            details = `☕ จิบกาแฟปั่น ${langName}: ${ws.activeFile}`;
            state = `🌱 ใน ${ws.workspaceName}${git ? ` (🌿 ${git.branch}${git.diff ? ` ✏️ ${git.diff}` : ""})` : ""}`;
            largeText = `🍃 ชิลล์ๆ กับ ${langName}`;
        } else {
            // LeonardSSH/vscord 1:1 default format
            details = `Editing ${ws.activeFile}`;
            state = `Workspace: ${ws.workspaceName}${git ? ` (${git.branch}${git.diff ? ` [${git.diff}]` : ""})` : ""}`;
        }
    }
    // 5. General Workspace / Idle Terminal Mode
    else {
        largeImage = "vscode";
        largeText = `In ${ws.workspaceName}`;

        if (theme === "thai") {
            details = "💻 เทอร์มินัลพร้อมใช้งาน";
            state = `📂 ${ws.workspaceName}${git ? ` (${git.branch})` : ""}`;
        } else if (theme === "cyber") {
            details = `💻 [IDLE] ${ws.workspaceName} Shell`;
            state = `root@${config.username} // ${ws.workspaceName}`;
        } else {
            details = `In ${ws.workspaceName}`;
            state = `Workspace: ${ws.workspaceName}${git ? ` (${git.branch})` : ""}`;
        }
    }

    // Interactive Buttons (Max 2, strictly validated)
    const buttons = [];
    if (config.showButtons) {
        if (Array.isArray(config.buttons) && config.buttons.length > 0) {
            for (const b of config.buttons) {
                if (b && b.label && b.url && typeof b.url === "string" && b.url.startsWith("http")) {
                    buttons.push({
                        label: truncateUtf8(b.label, 32),
                        url: truncateUtf8(b.url, 512)
                    });
                    if (buttons.length === 2) break;
                }
            }
        }

        if (buttons.length < 2) {
            const gitRemote = git?.remote;
            const profile = config.profileUrl || "https://github.com/ZXD44";
            const isThai = theme === "thai";

            if (buttons.length === 0) {
                if (gitRemote) {
                    buttons.push({ label: isThai ? "ดูซอร์สโค้ด" : "View Repository", url: gitRemote });
                    buttons.push({ label: isThai ? "โปรไฟล์ผู้พัฒนา" : "View Profile", url: profile });
                } else {
                    buttons.push({ label: isThai ? "โปรไฟล์ผู้พัฒนา" : "View Profile", url: profile });
                    buttons.push({ label: isThai ? "Zircord Repository" : "View Zircord", url: "https://github.com/ZXD44/Zircord" });
                }
            } else if (buttons.length === 1) {
                if (buttons[0].url !== profile) {
                    buttons.push({ label: isThai ? "โปรไฟล์ผู้พัฒนา" : "View Profile", url: profile });
                } else {
                    buttons.push({ label: isThai ? "Zircord Repository" : "View Zircord", url: "https://github.com/ZXD44/Zircord" });
                }
            }
        }
    }

    const activity = { instance: false };
    if (details && details.trim().length >= 2) {
        activity.details = truncateUtf8(details.trim(), 128);
    }
    if (state && state.trim().length >= 2) {
        activity.state = truncateUtf8(state.trim(), 128);
    }
    if (startTimestamp) {
        activity.timestamps = { start: startTimestamp };
    }

    const assets = {};
    if (largeImage) assets.large_image = truncateUtf8(largeImage, 128);
    if (largeText && largeText.trim().length >= 2) assets.large_text = truncateUtf8(largeText.trim(), 128);
    if (smallImage) assets.small_image = truncateUtf8(smallImage, 128);
    if (smallText && smallText.trim().length >= 2) assets.small_text = truncateUtf8(smallText.trim(), 128);

    if (Object.keys(assets).length > 0) activity.assets = assets;
    if (buttons.length > 0) activity.buttons = buttons;
    return activity;
}

// ============================================================================
// 🔌 DISCORD IPC CLIENT (PURE NODE.JS BUFFER PROTOCOL)
// ============================================================================
class DiscordIpcClient {
    constructor(clientId) {
        this.clientId = clientId;
        this.socket = null;
        this.updateInterval = null;
        this.pipeIndex = 0;
        this.reconnectTimer = null;
    }

    getPipePath(id) {
        if (IS_WIN) return `\\\\.\\pipe\\discord-ipc-${id}`;
        const env = process.env.XDG_RUNTIME_DIR || process.env.TMPDIR || process.env.TMP || "/tmp";
        return path.join(env, `discord-ipc-${id}`);
    }

    connect(pipeId = 0) {
        if (this.socket) {
            try { this.socket.destroy(); } catch {}
            this.socket = null;
        }

        this.pipeIndex = pipeId;
        const pipePath = this.getPipePath(pipeId);
        const s = net.createConnection(pipePath);

        s.on("connect", () => {
            this.socket = s;
            this.sendHandshake();
        });

        s.on("data", (data) => {
            try {
                if (data.length < 8) return;
                const op = data.readInt32LE(0);
                const len = data.readInt32LE(4);
                const body = JSON.parse(data.subarray(8, 8 + len).toString("utf8"));

                if (body.cmd === "DISPATCH" && body.evt === "READY") {
                    this.onReady();
                }
            } catch {}
        });

        s.on("error", () => {
            s.destroy();
            if (this.socket === s) this.socket = null;
            if (pipeId < 9) {
                this.connect(pipeId + 1);
            } else {
                this.scheduleReconnect(10000);
            }
        });

        s.on("close", () => {
            if (this.socket === s) {
                this.socket = null;
                if (this.updateInterval) {
                    clearInterval(this.updateInterval);
                    this.updateInterval = null;
                }
                this.scheduleReconnect(8000);
            }
        });
    }

    scheduleReconnect(delayMs) {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.connect(0), delayMs);
    }

    sendHandshake() {
        if (!this.socket || this.socket.destroyed) return;
        const payload = Buffer.from(JSON.stringify({ v: 1, client_id: this.clientId }), "utf8");
        const header = Buffer.alloc(8);
        header.writeInt32LE(0, 0); // Opcode 0: HANDSHAKE
        header.writeInt32LE(payload.length, 4);
        this.socket.write(Buffer.concat([header, payload]));
    }

    sendFrame(opcode, data) {
        if (!this.socket || this.socket.destroyed) return;
        const payload = Buffer.from(JSON.stringify(data), "utf8");
        const header = Buffer.alloc(8);
        header.writeInt32LE(opcode, 0); // Opcode 1: FRAME
        header.writeInt32LE(payload.length, 4);
        this.socket.write(Buffer.concat([header, payload]));
    }

    onReady() {
        this.sendCurrentPresence();
        if (!this.updateInterval) {
            this.updateInterval = setInterval(() => this.sendCurrentPresence(), 5000);
        }
    }

    sendCurrentPresence() {
        refreshProcessListAsync();
        const cfg = loadConfig(ACTIVE_TARGET_DIR);
        const now = Date.now();
        const afkLimit = (cfg.afkTimeoutMinutes || 5) * 60 * 1000;
        const ws = getWorkspaceActivity(ACTIVE_TARGET_DIR);

        if (ws.lastModified && ws.lastModified > LAST_ACTIVITY_TIME) {
            LAST_ACTIVITY_TIME = ws.lastModified;
        }

        const isAfk = now - LAST_ACTIVITY_TIME > afkLimit;
        const activity = buildActivity(cfg, ACTIVE_TARGET_DIR, START_TIMESTAMP, isAfk);

        this.sendFrame(1, {
            cmd: "SET_ACTIVITY",
            args: {
                pid: process.pid,
                activity
            },
            nonce: Math.random().toString(36).substring(2)
        });
    }
}

// ============================================================================
// 🕹️ CLI CONTROLLER & ENTRYPOINT
// ============================================================================
let ACTIVE_TARGET_DIR = process.cwd();
const START_TIMESTAMP = Math.floor(Date.now() / 1000);
let LAST_ACTIVITY_TIME = Date.now();

function handleCli() {
    const rawCmd = process.argv[2] || "";
    const cmd = rawCmd.toLowerCase();

    if (cmd === "stop") {
        let killed = false;
        try {
            if (fs.existsSync(PID_FILE)) {
                const data = JSON.parse(fs.readFileSync(PID_FILE, "utf8"));
                if (data && data.pid) {
                    process.kill(data.pid);
                    killed = true;
                }
                fs.unlinkSync(PID_FILE);
            }
        } catch {}

        if (IS_WIN) {
            try {
                safeExecSync("wmic", [
                    "process", "where",
                    `name='node.exe' and commandline like '%discord-rpc%' and processid!=${process.pid}`,
                    "call", "terminate"
                ]);
                killed = true;
            } catch {}
        }

        console.log(killed ? "✅ Zircord daemon stopped." : "ℹ️ No running Zircord daemon found.");
        process.exit(0);
    }

    if (cmd === "status") {
        let isRunning = false;
        let info = null;
        try {
            if (fs.existsSync(PID_FILE)) {
                info = JSON.parse(fs.readFileSync(PID_FILE, "utf8"));
                if (info && info.pid) {
                    process.kill(info.pid, 0);
                    isRunning = true;
                }
            }
        } catch {}

        console.log("🌌 Zircord (vscord edition) Status:");
        if (isRunning) {
            console.log(`  ● Daemon:      RUNNING (PID: ${info.pid})`);
            console.log(`  ● Monitoring:  ${info.targetDir || process.cwd()}`);
            console.log(`  ● Theme:       ${loadConfig(info.targetDir).theme}`);
        } else {
            console.log("  ○ Daemon:      STOPPED");
            console.log("  💡 Run 'zircord start' to launch in background.");
        }
        process.exit(0);
    }

    if (cmd === "start") {
        const target = process.argv[3] ? path.resolve(process.argv[3]) : process.cwd();
        const child = spawn(process.execPath, [__filename, target], {
            detached: true,
            stdio: "ignore",
            cwd: target
        });
        child.unref();
        console.log(`🚀 Zircord daemon started in background.`);
        console.log(`📁 Monitoring: ${target}`);
        process.exit(0);
    }

    if (cmd === "run") {
        const cli = process.argv[3];
        const cliArgs = process.argv.slice(4);
        if (!cli) {
            console.log("Usage: zircord run <command> [args...]");
            process.exit(1);
        }
        const proc = spawn(cli, cliArgs, { stdio: "inherit", shell: true });
        proc.on("exit", (code) => process.exit(code || 0));
        return;
    }

    if (["--help", "-h", "help"].includes(cmd)) {
        console.log(`
💎 Zircord (vscord edition) - Universal Discord Rich Presence
Usage:
  zircord [path]               Run Zircord foreground monitoring folder
  zircord start [path]         Start background daemon silently
  zircord stop                 Stop running daemon
  zircord status               Show daemon status & metrics
  zircord run <cmd> [args...]  Run any CLI with active presence tracking
`);
        process.exit(0);
    }

    if (rawCmd && fs.existsSync(rawCmd)) {
        ACTIVE_TARGET_DIR = path.resolve(rawCmd);
    }
}

// Keep daemon process permanently resilient
process.on("uncaughtException", () => {});
process.on("unhandledRejection", () => {});
setInterval(() => {}, 60000);

// Start Main Daemon
handleCli();
enforceSingleInstance(ACTIVE_TARGET_DIR);

const initialConfig = loadConfig(ACTIVE_TARGET_DIR);
const clientId = initialConfig.clientId || VSCODE_CLIENT_ID;
const client = new DiscordIpcClient(clientId);
client.connect(0);
