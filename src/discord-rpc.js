const net = require("net");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

const CLIENT_ID = process.env.DISCORD_CLIENT_ID || "782685898163617802"; // vscord official app ID
const USER_TAG = process.env.AGY_USER || process.env.USERNAME || "ZirconX";
const targetDir = process.argv[2] || process.cwd();
const startTimestamp = Math.floor(Date.now() / 1000);

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

function getAgentActivity() {
    const brainDir = path.join(process.env.USERPROFILE || "", ".gemini", "antigravity-cli", "brain");
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
            return { action: "Architecting", target: "Planning Next Steps" };
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

    const folderName = path.basename(targetDir) || "Workspace";
    const branch = getGitInfo(targetDir);
    const projLang = detectProjectLanguage(targetDir);
    const agent = getAgentActivity();
    const wsMod = getRecentlyModifiedWorkspaceFile(targetDir);

    let details = "";
    let state = "";
    let largeImage = projLang.icon;
    let largeText = `${projLang.name} • AgyCord`;
    let smallImage = "vscode";
    let smallText = `👤 ${USER_TAG}`;

    const gitBranchText = branch ? `🌿 ${branch}` : "";
    const dirtyCountText = wsMod?.totalDirty ? `⚡ ${wsMod.totalDirty} modified` : "";
    const gitContext = [gitBranchText, dirtyCountText].filter(Boolean).join(" • ");

    // Identity badge: 👤 ZirconX @ agycord (🌿 main)
    const contextBadge = gitContext ? ` (${gitContext})` : "";
    const userBadge = `👤 ${USER_TAG} @ ${folderName}${contextBadge}`;

    if (agent) {
        const lang = agent.ext && LANG_MAP[agent.ext] ? LANG_MAP[agent.ext] : projLang;
        largeImage = lang.icon;
        largeText = `${lang.name} • ${USER_TAG}`;

        if (agent.action === "Writing") {
            details = `⚡ Writing ${lang.name}: ${agent.target}`;
            state = userBadge;
        } else if (agent.action === "Inspecting") {
            details = `📖 Reading: ${agent.target} (${lang.name})`;
            state = userBadge;
        } else if (agent.action === "Executing") {
            details = `⚙️ Executing: ${agent.target}`;
            state = userBadge;
        } else if (agent.action === "Researching") {
            details = `🔍 Researching: ${agent.target}`;
            state = userBadge;
        } else {
            details = `🧠 ${agent.action}: ${agent.target}`;
            state = userBadge;
        }
    } else if (wsMod && wsMod.file) {
        const lang = wsMod.ext && LANG_MAP[wsMod.ext] ? LANG_MAP[wsMod.ext] : projLang;
        largeImage = lang.icon;
        largeText = `${lang.name} • ${USER_TAG}`;
        details = `⚡ Writing ${lang.name}: ${wsMod.file}`;
        state = userBadge;
    } else {
        if (projLang.name !== "Multi-Language") {
            details = `⚡ Developing ${projLang.name} Project`;
        } else {
            details = `💻 Crafting in ${folderName}`;
        }
        state = userBadge;
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
