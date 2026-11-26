/**
 * Zircord Claude Code Hook Bridge
 * Reads Claude Code hook JSON from stdin and writes live status to ~/.gemini/zircord-claude.json
 */
const fs = require("fs");
const path = require("path");
const os = require("os");

const USER_HOME = process.env.USERPROFILE || process.env.HOME || os.homedir() || "";
const STATE_FILE = path.join(USER_HOME, ".gemini", "zircord-claude.json");

function readStdin() {
    return new Promise((resolve) => {
        let data = "";
        process.stdin.setEncoding("utf8");
        process.stdin.on("data", (chunk) => { data += chunk; });
        process.stdin.on("end", () => resolve(data));
        setTimeout(() => resolve(data), 500);
    });
}

function summarizeTool(toolName, input = {}) {
    const t = String(toolName || "");
    if (["Edit", "Write", "MultiEdit", "NotebookEdit"].includes(t)) {
        const p = input.file_path || input.notebook_path || "";
        return { action: "Writing", target: p ? path.basename(p) : "Code" };
    }
    if (t === "Read") {
        const p = input.file_path || "";
        return { action: "Reading", target: p ? path.basename(p) : "File" };
    }
    if (["Grep", "Glob"].includes(t)) {
        const q = input.pattern || (input.path ? path.basename(input.path) : "");
        return { action: "Searching", target: q ? String(q).slice(0, 36) : "Codebase" };
    }
    if (t === "Bash") {
        const cmd = String(input.command || "").trim().split(/\r?\n/)[0];
        return { action: "Running", target: cmd ? cmd.slice(0, 36) : "Command" };
    }
    if (["WebFetch", "WebSearch", "Agent", "Task"].includes(t)) {
        return { action: "Researching", target: input.description || t };
    }
    return { action: "Using", target: t.replace(/^mcp__/, "").slice(0, 36) || "Tool" };
}

(async () => {
    try {
        const raw = await readStdin();
        if (!raw.trim()) process.exit(0);
        const payload = JSON.parse(raw);
        const evt = payload.hook_event_name || "";

        if (evt === "SessionEnd") {
            try { if (fs.existsSync(STATE_FILE)) fs.unlinkSync(STATE_FILE); } catch {}
            process.exit(0);
        }

        let prev = {};
        try {
            if (fs.existsSync(STATE_FILE)) {
                prev = JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) || {};
            }
        } catch {}

        const sameSession = prev.sessionId && payload.session_id && prev.sessionId === payload.session_id;
        let toolCount = sameSession ? (prev.toolCount || 0) : 0;
        let action = prev.action || "Assisting";
        let target = prev.target || "Workspace";

        if (evt === "UserPromptSubmit") {
            action = "Thinking";
            target = "Prompt";
        } else if (evt === "PreToolUse") {
            toolCount += 1;
            const info = summarizeTool(payload.tool_name, payload.tool_input);
            action = info.action;
            target = info.target;
        } else if (evt === "PostToolUse") {
            const info = summarizeTool(payload.tool_name, payload.tool_input);
            action = info.action;
            target = info.target;
        } else if (evt === "Stop") {
            action = "Waiting";
            target = "Prompt";
        }

        const state = {
            sessionId: payload.session_id || prev.sessionId || "",
            event: evt,
            action,
            target,
            cwd: payload.cwd || prev.cwd || "",
            model: payload.model || prev.model || "",
            toolCount,
            timestamp: Date.now()
        };

        fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
        const tmpFile = `${STATE_FILE}.tmp`;
        fs.writeFileSync(tmpFile, JSON.stringify(state), "utf8");
        fs.renameSync(tmpFile, STATE_FILE);
    } catch {}
    process.exit(0);
})();
