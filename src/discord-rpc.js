const net = require("net");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

// ==========================================
// ⚙️ CONFIGURATION LOADER (clicord.json)
// ==========================================
const userHome = process.env.USERPROFILE || "";
const globalConfigPath = path.join(userHome, ".gemini", "clicord.json");
const localConfigPath = path.join(process.cwd(), "clicord.json");
const fallbackConfigPath = path.join(userHome, ".gemini", "agycord.json");

function loadConfig() {
    let cfg = {
        theme: "thai",
        username: process.env.CLICORD_USER || process.env.AGY_USER || process.env.USERNAME || "ZirconX",
        afkTimeoutMinutes: 5,
        showButtons: true,
        profileUrl: "https://github.com/ZirconX",
        showGitStats: true,
        customStatus: ""
    };

    try {
        if (fs.existsSync(localConfigPath)) {
            cfg = { ...cfg, ...JSON.parse(fs.readFileSync(localConfigPath, "utf8")) };
        } else if (fs.existsSync(globalConfigPath)) {
            cfg = { ...cfg, ...JSON.parse(fs.readFileSync(globalConfigPath, "utf8")) };
        } else if (fs.existsSync(fallbackConfigPath)) {
            cfg = { ...cfg, ...JSON.parse(fs.readFileSync(fallbackConfigPath, "utf8")) };
        }
    } catch {}
    return cfg;
}

let config = loadConfig();
const CLIENT_ID = process.env.DISCORD_CLIENT_ID || "782685898163617802"; // vscord official app ID
const targetDir = process.argv[2] || process.cwd();
const startTimestamp = Math.floor(Date.now() / 1000);
let lastActivityTime = Date.now();
let lastTrackedTarget = "";

const TEMPLATES = {
    thai: {
        writing: (lang, file) => `⚡ กำลังเขียน ${lang}: ${file}`,
        reading: (lang, file) => `📖 กำลังส่องโค้ด: ${file}`,
        running: (target) => `⚙️ กำลังรันคำสั่ง: ${target}`,
        searching: (query) => `🔍 กำลังค้นคว้า: ${query}`,
        planning: (task) => `🧠 กำลังวางแผนโค้ด: ${task}`,
        idleLang: (lang) => `⚡ ลุยโปรเจกต์ ${lang}`,
        idleGeneric: (folder) => `💻 นั่งเขียนโค้ดใน ${folder}`,
        afkDetails: () => `☕ กำลังพักเบรก / AFK`,
        afkState: (user) => `พักสายตาแป๊บเดียว • 👤 ${user}`,
        state: (user, folder, git) => `👤 ${user} @ ${folder}${git ? ` (${git})` : ""}`,
        gitFormat: (branch, dirty, diff) => {
            const parts = [];
            if (branch) parts.push(`🌿 ${branch}`);
            if (dirty) {
                const diffStr = diff ? ` [${diff}]` : "";
                parts.push(`✏️ แก้ไป ${dirty} ไฟล์${diffStr}`);
            }
            return parts.join(" • ");
        }
    },
    modern: {
        writing: (lang, file) => `⚡ Writing ${lang}: ${file}`,
        reading: (lang, file) => `📖 Reading: ${file} (${lang})`,
        running: (target) => `⚙️ Executing: ${target}`,
        searching: (query) => `🔍 Researching: ${query}`,
        planning: (task) => `🧠 Architecting: ${task}`,
        idleLang: (lang) => `⚡ Developing ${lang} Project`,
        idleGeneric: (folder) => `💻 Crafting in ${folder}`,
        afkDetails: () => `☕ On a Coffee Break / AFK`,
        afkState: (user) => `Taking a short rest • 👤 ${user}`,
        state: (user, folder, git) => `👤 ${user} @ ${folder}${git ? ` (${git})` : ""}`,
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
        writing: (lang, file) => `⚡ [DEV] ${lang} // ${file}`,
        reading: (lang, file) => `👁️ [INSPECT] ${file}`,
        running: (target) => `🔥 [EXEC] ${target}`,
        searching: (query) => `📡 [SCAN] ${query}`,
        planning: (task) => `🧬 [MATRIX] ${task}`,
        idleLang: (lang) => `⚡ [ONLINE] ${lang} Node`,
        idleGeneric: (folder) => `💻 [IDLE] ${folder} Shell`,
        afkDetails: () => `💤 [STANDBY] Node Idle`,
        afkState: (user) => `root@${user} // sleep_mode`,
        state: (user, folder, git) => `root@${user} // ${folder}${git ? ` [${git}]` : ""}`,
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
        writing: (lang, file) => `☕ จิบกาแฟปั่น ${lang}: ${file}`,
        reading: (lang, file) => `📚 นั่งอ่านโค้ด: ${file}`,
        running: (target) => `🔨 เทสต์ระบบ: ${target}`,
        searching: (query) => `🔎 ส่องไอเดีย: ${query}`,
        planning: (task) => `💭 วางแผนทำของเจ๋งๆ`,
        idleLang: (lang) => `🍃 ชิลล์ๆ กับ ${lang}`,
        idleGeneric: (folder) => `✨ อยู่ในโฟลเดอร์ ${folder}`,
        afkDetails: () => `☕ จิบชาพักผ่อน / AFK`,
        afkState: (user) => `🌱 ${user} กำลังพักผ่อน`,
        state: (user, folder, git) => `🌱 ${user} ใน ${folder}${git ? ` (${git})` : ""}`,
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

function detectProjectLanguage(dir) {
    try {
        if (fs.existsSync(path.join(dir, "Cargo.toml"))) return LANG_MAP.rs;
        if (fs.existsSync(path.join(dir, "tsconfig.json"))) return LANG_MAP.ts;
        if (fs.existsSync(path.join(dir, "package.json"))) return LANG_MAP.js;
        if (fs.existsSync(path.join(dir, "requirements.txt")) || fs.existsSync(path.join(dir, "pyproject.toml"))) return LANG_MAP.py;
        if (fs.existsSync(path.join(dir, "go.mod"))) return LANG_MAP.go;
        if (fs.existsSync(path.join(dir, "default.project.json")) || fs.existsSync(path.join(dir, "wally.toml"))) return LANG_MAP.lua;

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
        return `${plus}/${minus}`;
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

let socket = null;
let updateInterval = null;

function connect(pipeIndex = 0) {
    if (pipeIndex > 9) {
        setTimeout(() => connect(0), 10000);
        return;
    }

    const pipePath = `\\\\.\\pipe\\discord-ipc-${pipeIndex}`;
    const s = net.connect(pipePath, () => {
        socket = s;
        const payload = Buffer.from(JSON.stringify({ v: 1, client_id: CLIENT_ID }));
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

    // Reload config if changed
    config = loadConfig();
    const t = TEMPLATES[config.theme] || TEMPLATES.thai;
    const userTag = config.username || USER_TAG;
    const folderName = path.basename(targetDir) || "Workspace";
    const branch = getGitInfo(targetDir);
    const projLang = detectProjectLanguage(targetDir);
    const agent = getAgentActivity();
    const wsMod = getRecentlyModifiedWorkspaceFile(targetDir);
    const diffStats = config.showGitStats ? getGitDiffStats(targetDir) : null;

    // Track active changes for AFK calculation
    const currentActivityKey = (agent ? `${agent.action}:${agent.target}` : "") + (wsMod?.file || "");
    if (currentActivityKey && currentActivityKey !== lastTrackedTarget) {
        lastActivityTime = Date.now();
        lastTrackedTarget = currentActivityKey;
    }

    // Check AFK condition
    const afkLimitMs = (config.afkTimeoutMinutes || 5) * 60 * 1000;
    const isAfk = Date.now() - lastActivityTime > afkLimitMs;

    let details = "";
    let state = "";
    let largeImage = projLang.icon;
    let largeText = `${projLang.name} • ${userTag}`;
    let smallImage = "vscode";
    let smallText = `👤 ${userTag} • Clicord`;

    const gitContext = t.gitFormat(branch, wsMod?.totalDirty, diffStats);
    state = t.state(userTag, folderName, gitContext);

    if (isAfk) {
        // AFK Mode
        details = t.afkDetails();
        state = t.afkState(userTag);
        largeImage = "idle";
        largeText = `AFK (${config.afkTimeoutMinutes}m) • ${userTag}`;
    } else if (agent) {
        const lang = agent.ext && LANG_MAP[agent.ext] ? LANG_MAP[agent.ext] : projLang;
        largeImage = lang.icon;
        largeText = `${lang.name} • ${userTag}`;

        if (agent.action === "Writing") {
            details = t.writing(lang.name, agent.target);
        } else if (agent.action === "Inspecting") {
            details = t.reading(lang.name, agent.target);
        } else if (agent.action === "Executing") {
            details = t.running(agent.target);
        } else if (agent.action === "Researching") {
            details = t.searching(agent.target);
        } else {
            details = t.planning(agent.target);
        }
    } else if (wsMod && wsMod.file) {
        const lang = wsMod.ext && LANG_MAP[wsMod.ext] ? LANG_MAP[wsMod.ext] : projLang;
        largeImage = lang.icon;
        largeText = `${lang.name} • ${userTag}`;
        details = t.writing(lang.name, wsMod.file);
    } else {
        if (projLang.name !== "Multi-Language") {
            details = t.idleLang(projLang.name);
        } else {
            details = t.idleGeneric(folderName);
        }
    }

    // Interactive Buttons setup (Max 2)
    const buttons = [];
    if (config.showButtons) {
        const remoteUrl = getGitRemoteUrl(targetDir);
        if (remoteUrl) {
            buttons.push({ label: "📂 ดูโค้ดบน GitHub", url: remoteUrl });
        }
        if (config.profileUrl && buttons.length < 2) {
            buttons.push({ label: `👤 ${userTag} Profile`, url: config.profileUrl });
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
