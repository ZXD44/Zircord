use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use crate::hook::{now_ms, state_file_path, ClaudeHookState};
use crate::win::run_silent;

pub const VSCODE_CLIENT_ID: &str = "383226320970055681";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ButtonConfig {
    pub label: String,
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct ZircordConfig {
    pub theme: String,
    pub username: String,
    pub app_name: String,
    pub afk_timeout_minutes: u64,
    pub show_buttons: bool,
    pub profile_url: String,
    pub buttons: Vec<ButtonConfig>,
    pub show_git_stats: bool,
    pub enable_roblox_detection: bool,
    pub enable_freebuff_detection: bool,
    pub enable_kiro_detection: bool,
    pub enable_agent_detection: bool,
    pub enable_cli_detection: bool,
    pub client_id: String,
}

impl Default for ZircordConfig {
    fn default() -> Self {
        let user = std::env::var("ZIRCORD_USER")
            .or_else(|_| std::env::var("USERNAME"))
            .unwrap_or_else(|_| "Developer".to_string());
        Self {
            theme: "vscord".to_string(),
            username: user,
            app_name: "Visual Studio Code".to_string(),
            afk_timeout_minutes: 5,
            show_buttons: true,
            profile_url: "https://github.com/ZXD44".to_string(),
            buttons: Vec::new(),
            show_git_stats: true,
            enable_roblox_detection: true,
            enable_freebuff_detection: true,
            enable_kiro_detection: true,
            enable_agent_detection: true,
            enable_cli_detection: true,
            client_id: String::new(),
        }
    }
}

pub fn load_config(start_dir: &Path, user_home: &Path) -> ZircordConfig {
    let candidates = [
        start_dir.join("zircord.json"),
        user_home.join(".gemini").join("zircord.json"),
        user_home.join(".gemini").join("clicord.json"),
    ];
    for p in candidates {
        if let Ok(raw) = fs::read_to_string(&p) {
            if let Ok(cfg) = serde_json::from_str::<ZircordConfig>(&raw) {
                return cfg;
            }
        }
    }
    ZircordConfig::default()
}

pub fn truncate_utf8(s: &str, max_bytes: usize) -> String {
    if s.len() <= max_bytes {
        return s.to_string();
    }
    let mut end = max_bytes;
    while end > 0 && !s.is_char_boundary(end) {
        end -= 1;
    }
    s[..end].to_string()
}

fn lang_info(ext: &str) -> (&'static str, &'static str) {
    match ext {
        "js" | "mjs" | "cjs" => ("javascript", "JavaScript"),
        "jsx" => ("react", "React JSX"),
        "ts" => ("typescript", "TypeScript"),
        "tsx" => ("react_ts", "React TSX"),
        "py" | "pyw" => ("python", "Python"),
        "lua" | "luau" => ("lua", "Luau"),
        "rs" => ("rust", "Rust"),
        "go" => ("go", "Go"),
        "c" | "h" => ("c", "C"),
        "cpp" | "hpp" => ("cpp", "C++"),
        "cs" => ("csharp", "C#"),
        "html" => ("html", "HTML"),
        "css" => ("css", "CSS"),
        "scss" | "sass" => ("sass", "Sass"),
        "less" => ("less", "Less"),
        "json" | "jsonc" => ("json", "JSON"),
        "md" | "markdown" => ("markdown", "Markdown"),
        "yaml" | "yml" => ("yaml", "YAML"),
        "toml" => ("toml", "TOML"),
        "sql" => ("sql", "SQL"),
        "sh" | "bash" | "zsh" => ("shell", "Shell"),
        "ps1" => ("powershell", "PowerShell"),
        "dockerfile" | "docker" => ("docker", "Docker"),
        "vue" => ("vue", "Vue"),
        "java" => ("java", "Java"),
        "kt" | "kts" => ("kotlin", "Kotlin"),
        "swift" => ("swift", "Swift"),
        "dart" => ("dart", "Dart"),
        "rb" => ("ruby", "Ruby"),
        "php" => ("php", "PHP"),
        _ => ("vscode", "Text"),
    }
}

fn find_git_root(dir: &Path) -> Option<PathBuf> {
    let mut cur = dir.to_path_buf();
    for _ in 0..8 {
        if cur.join(".git").exists() {
            return Some(cur);
        }
        if !cur.pop() {
            break;
        }
    }
    None
}

struct GitData {
    branch: String,
    remote: Option<String>,
    diff: String,
}

fn get_git_data(dir: &Path) -> Option<GitData> {
    let root = find_git_root(dir)?;
    let branch = run_silent("git", &["rev-parse", "--abbrev-ref", "HEAD"], Some(&root))
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "main".to_string());

    let remote_raw = run_silent("git", &["config", "--get", "remote.origin.url"], Some(&root))
        .unwrap_or_default();
    let remote = if remote_raw.is_empty() {
        None
    } else {
        let mut url = remote_raw;
        if let Some(rest) = url.strip_prefix("git@github.com:") {
            url = format!("https://github.com/{}", rest);
        } else if let Some(rest) = url.strip_prefix("ssh://git@github.com/") {
            url = format!("https://github.com/{}", rest);
        }
        url = url.trim_end_matches(".git").to_string();
        if url.starts_with("http") {
            Some(url)
        } else {
            None
        }
    };

    let shortstat = run_silent("git", &["diff", "--shortstat"], Some(&root)).unwrap_or_default();
    let mut diff = String::new();
    if !shortstat.is_empty() {
        let ins = extract_stat_num(&shortstat, "insertion");
        let del = extract_stat_num(&shortstat, "deletion");
        diff = format!("+{} -{}", ins, del);
    }

    Some(GitData {
        branch,
        remote,
        diff,
    })
}

fn extract_stat_num(s: &str, keyword: &str) -> u64 {
    for part in s.split(',') {
        if part.contains(keyword) {
            for tok in part.split_whitespace() {
                if let Ok(n) = tok.parse::<u64>() {
                    return n;
                }
            }
        }
    }
    0
}

struct WorkspaceActivity {
    workspace_name: String,
    active_file: String,
    active_ext: String,
    last_modified: u64,
}

fn mtime_ms(p: &Path) -> u64 {
    fs::metadata(p)
        .and_then(|m| m.modified())
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

fn get_workspace_activity(dir: &Path) -> WorkspaceActivity {
    let git_root = find_git_root(dir);
    let search_dir = git_root.as_deref().unwrap_or(dir);
    let mut newest_file = String::new();
    let mut newest_ext = String::new();
    let mut newest_mtime = 0u64;

    if let Some(ref root) = git_root {
        if let Some(status) = run_silent("git", &["status", "--porcelain", "-u"], Some(root)) {
            for line in status.lines() {
                if line.len() < 4 {
                    continue;
                }
                let rel = line[3..].trim().trim_matches('"');
                let full = root.join(rel);
                let mt = mtime_ms(&full);
                if mt > newest_mtime {
                    newest_mtime = mt;
                    newest_file = full
                        .file_name()
                        .and_then(|s| s.to_str())
                        .unwrap_or("")
                        .to_string();
                    newest_ext = full
                        .extension()
                        .and_then(|s| s.to_str())
                        .unwrap_or("")
                        .to_lowercase();
                }
            }
        }
    }

    if newest_file.is_empty() {
        if let Ok(entries) = fs::read_dir(search_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_file() {
                    let mt = mtime_ms(&path);
                    if mt > newest_mtime {
                        newest_mtime = mt;
                        newest_file = path
                            .file_name()
                            .and_then(|s| s.to_str())
                            .unwrap_or("")
                            .to_string();
                        newest_ext = path
                            .extension()
                            .and_then(|s| s.to_str())
                            .unwrap_or("")
                            .to_lowercase();
                    }
                }
            }
        }
    }

    let ws_name = search_dir
        .file_name()
        .and_then(|s| s.to_str())
        .filter(|s| !s.is_empty())
        .unwrap_or("Workspace")
        .to_string();

    WorkspaceActivity {
        workspace_name: ws_name,
        active_file: newest_file,
        active_ext: newest_ext,
        last_modified: newest_mtime,
    }
}

pub struct AiActivity {
    pub agent: String,
    pub action: String,
    pub target: String,
    pub cwd: String,
    pub model: String,
    pub tool_count: u64,
    pub timestamp: u64,
}

fn read_claude_hook_state(user_home: &Path, procs: &HashSet<String>) -> Option<AiActivity> {
    let state_path = state_file_path(user_home);
    let raw = fs::read_to_string(&state_path).ok()?;
    let data: ClaudeHookState = serde_json::from_str(&raw).ok()?;
    if data.timestamp == 0 {
        return None;
    }
    let age = now_ms().saturating_sub(data.timestamp);
    let claude_running = procs.contains("claude.exe") || procs.contains("claude");
    if claude_running || age < 30_000 {
        // Keep showing last state while claude.exe is open; if stale > 5m, show Waiting
        let (action, target) = if age > 300_000 && claude_running {
            ("Waiting".to_string(), "Standby".to_string())
        } else {
            (
                if data.action.is_empty() {
                    "Assisting".to_string()
                } else {
                    data.action
                },
                if data.target.is_empty() {
                    "Workspace".to_string()
                } else {
                    data.target
                },
            )
        };
        return Some(AiActivity {
            agent: "Claude Code".to_string(),
            action,
            target,
            cwd: data.cwd,
            model: data.model,
            tool_count: data.tool_count,
            timestamp: data.timestamp,
        });
    }
    None
}

fn read_antigravity_activity(user_home: &Path) -> Option<AiActivity> {
    let brain_dir = user_home.join(".gemini").join("antigravity-cli").join("brain");
    let entries = fs::read_dir(&brain_dir).ok()?;
    let mut dirs: Vec<(PathBuf, u64)> = entries
        .flatten()
        .filter(|e| e.path().is_dir() && e.file_name() != "scratch")
        .map(|e| {
            let p = e.path();
            let mt = mtime_ms(&p);
            (p, mt)
        })
        .collect();
    dirs.sort_by(|a, b| b.1.cmp(&a.1));
    let newest = dirs.first()?.0.clone();
    let transcript = newest.join(".system_generated").join("logs").join("transcript.jsonl");
    let mt = mtime_ms(&transcript);
    if mt == 0 || now_ms().saturating_sub(mt) >= 180_000 {
        return None;
    }

    let content = fs::read(&transcript).ok()?;
    let start = content.len().saturating_sub(4096);
    let tail = String::from_utf8_lossy(&content[start..]);
    let last_line = tail.lines().rfind(|l| !l.trim().is_empty())?;
    let item: Value = serde_json::from_str(last_line).ok()?;
    if item["type"].as_str() == Some("PLANNER_RESPONSE") {
        if let Some(call) = item["tool_calls"].as_array().and_then(|a| a.first()) {
            let t_name = call["name"].as_str().unwrap_or("");
            let target = call["args"]["Path"]
                .as_str()
                .and_then(|p| Path::new(p).file_name().and_then(|s| s.to_str()))
                .or_else(|| call["args"]["toolSummary"].as_str())
                .unwrap_or("Workspace Task")
                .to_string();
            let action = if t_name.contains("edit") || t_name.contains("write") {
                "Writing"
            } else {
                "Refactoring"
            };
            return Some(AiActivity {
                agent: "Antigravity".to_string(),
                action: action.to_string(),
                target,
                cwd: String::new(),
                model: String::new(),
                tool_count: 0,
                timestamp: mt,
            });
        }
    }
    None
}

pub fn detect_ai_activity(user_home: &Path, procs: &HashSet<String>) -> Option<AiActivity> {
    let claude = read_claude_hook_state(user_home, procs);
    let agy = read_antigravity_activity(user_home);

    match (claude, agy) {
        (Some(c), Some(a)) => {
            if c.timestamp >= a.timestamp {
                Some(c)
            } else {
                Some(a)
            }
        }
        (Some(c), None) => Some(c),
        (None, Some(a)) => Some(a),
        (None, None) => {
            if procs.contains("claude.exe") || procs.contains("claude") {
                return Some(AiActivity {
                    agent: "Claude Code".to_string(),
                    action: "Waiting".to_string(),
                    target: "Standby".to_string(),
                    cwd: String::new(),
                    model: String::new(),
                    tool_count: 0,
                    timestamp: 0,
                });
            }
            if procs.contains("kiro.exe") || procs.contains("kiro-cli.exe") {
                return Some(AiActivity {
                    agent: "Kiro AI".to_string(),
                    action: "Coding".to_string(),
                    target: "Workspace".to_string(),
                    cwd: String::new(),
                    model: String::new(),
                    tool_count: 0,
                    timestamp: 0,
                });
            }
            if procs.contains("aider.exe") || procs.contains("aider") {
                return Some(AiActivity {
                    agent: "Aider".to_string(),
                    action: "Pair Programming".to_string(),
                    target: "Workspace".to_string(),
                    cwd: String::new(),
                    model: String::new(),
                    tool_count: 0,
                    timestamp: 0,
                });
            }
            if procs.contains("freebuff.exe") {
                return Some(AiActivity {
                    agent: "Freebuff".to_string(),
                    action: "Coding".to_string(),
                    target: "Workspace".to_string(),
                    cwd: String::new(),
                    model: String::new(),
                    tool_count: 0,
                    timestamp: 0,
                });
            }
            None
        }
    }
}

fn detect_roblox_studio(dir: &Path, procs: &HashSet<String>) -> Option<String> {
    if !(procs.contains("robloxstudiobeta.exe") || procs.contains("robloxstudio.exe")) {
        return None;
    }
    let mut title = "Roblox Experience".to_string();
    if let Ok(raw) = fs::read_to_string(dir.join("default.project.json")) {
        if let Ok(val) = serde_json::from_str::<Value>(&raw) {
            if let Some(name) = val["name"].as_str() {
                title = name.to_string();
            }
        }
    }
    Some(title)
}

fn detect_active_program(procs: &HashSet<String>) -> Option<&'static str> {
    if procs.contains("cursor.exe") {
        Some("Cursor")
    } else if procs.contains("windsurf.exe") {
        Some("Windsurf")
    } else if procs.contains("antigravity.exe") || procs.contains("agy.exe") {
        Some("Antigravity")
    } else if procs.contains("code.exe") {
        Some("VS Code")
    } else if procs.contains("devenv.exe") {
        Some("Visual Studio")
    } else if procs.contains("idea64.exe") {
        Some("IntelliJ IDEA")
    } else if procs.contains("nvim.exe") || procs.contains("nvim") {
        Some("Neovim")
    } else if procs.contains("vim.exe") || procs.contains("vim") {
        Some("Vim")
    } else if procs.contains("hx.exe") || procs.contains("hx") {
        Some("Helix")
    } else if procs.contains("windowsterminal.exe") {
        Some("Windows Terminal")
    } else if procs.contains("pwsh.exe") {
        Some("PowerShell 7")
    } else if procs.contains("powershell.exe") {
        Some("PowerShell")
    } else {
        None
    }
}

fn format_ai_action<'a>(action: &'a str, theme: &str) -> String {
    match (action, theme) {
        ("Writing", "thai") => "✏️ กำลังเขียน".into(),
        ("Writing", "cyber") => "Patching".into(),
        ("Writing", _) => "✏️ Writing".into(),
        ("Reading", "thai") => "📖 กำลังอ่าน".into(),
        ("Reading", "cyber") => "Inspecting".into(),
        ("Reading", _) => "📖 Reading".into(),
        ("Searching", "thai") => "🔍 กำลังค้นหา".into(),
        ("Searching", "cyber") => "Scanning".into(),
        ("Searching", _) => "🔍 Searching".into(),
        ("Running", "thai") => "⚡ กำลังรัน".into(),
        ("Running", "cyber") => "Exec".into(),
        ("Running", _) => "⚡ Running".into(),
        ("Thinking", "thai") => "🧠 กำลังคิด".into(),
        ("Thinking", "cyber") => "Reasoning".into(),
        ("Thinking", _) => "🧠 Thinking".into(),
        ("Researching", "thai") => "🌐 กำลังค้นคว้า".into(),
        ("Researching", "cyber") => "Querying".into(),
        ("Researching", _) => "🌐 Researching".into(),
        ("Waiting", "thai") => "☕ เปิดค้างไว้ (รอคำสั่ง)".into(),
        ("Waiting", "cyber") => "Standby".into(),
        ("Waiting", _) => "☕ Standby".into(),
        _ => {
            if theme == "thai" {
                format!("🤖 {}", action)
            } else {
                action.to_string()
            }
        }
    }
}

pub fn build_activity(
    cfg: &ZircordConfig,
    target_dir: &Path,
    user_home: &Path,
    start_ts: u64,
    is_afk: bool,
    ai: Option<&AiActivity>,
    procs: &HashSet<String>,
) -> Value {
    let effective_dir = ai
        .filter(|a| !a.cwd.is_empty() && Path::new(&a.cwd).exists())
        .map(|a| Path::new(&a.cwd))
        .unwrap_or(target_dir);

    let ws = get_workspace_activity(effective_dir);
    let git = if cfg.show_git_stats {
        get_git_data(effective_dir)
    } else {
        None
    };
    let rbx = if cfg.enable_roblox_detection {
        detect_roblox_studio(effective_dir, procs)
    } else {
        None
    };
    let active_prog = detect_active_program(procs);

    let ai_ext = ai
        .and_then(|a| Path::new(&a.target).extension().and_then(|e| e.to_str()))
        .unwrap_or("")
        .to_lowercase();
    let (_, _) = lang_info(&ai_ext);
    let use_ext = if lang_info(&ai_ext).0 != "vscode" {
        ai_ext.as_str()
    } else {
        ws.active_ext.as_str()
    };
    let (lang_icon, lang_name) = lang_info(use_ext);
    let theme = cfg.theme.to_lowercase();

    let mut details = String::new();
    let mut state = String::new();
    let mut large_image = lang_icon.to_string();
    let mut large_text = String::new();
    let small_image = "vscode".to_string();
    let mut small_text = cfg.app_name.clone();

    // 1. Roblox Studio Mode (shows even if left open)
    if let Some(place_title) = rbx {
        large_image = "lua".to_string();
        let suffix = if is_afk { " (Idle)" } else { "" };
        if theme == "thai" {
            details = format!("🎮 Roblox Studio: {}{}", place_title, suffix);
            state = format!(
                "📂 {}{}",
                ws.workspace_name,
                git.as_ref().map(|g| format!(" ({})", g.branch)).unwrap_or_default()
            );
            large_text = format!("Roblox Studio • {}", place_title);
            small_text = "Roblox Developer".to_string();
        } else {
            details = format!("Developing {}{}", place_title, suffix);
            state = format!(
                "Workspace: {}{}",
                ws.workspace_name,
                git.as_ref().map(|g| format!(" ({})", g.branch)).unwrap_or_default()
            );
            large_text = format!("Roblox Studio • {}", place_title);
            small_text = "Roblox Studio".to_string();
        }
    }
    // 2. AI Agent Coding Mode (also stays visible when Claude/AI is left open)
    else if let Some(a) = ai {
        large_image = lang_icon.to_string();
        large_text = format!("{} • {}", a.agent, lang_name);
        let mut meta = vec![a.agent.clone()];
        if !a.model.is_empty() {
            meta.push(a.model.clone());
        }
        if a.tool_count > 0 {
            meta.push(format!("{} ops", a.tool_count));
        }
        small_text = format!("🤖 {}", meta.join(" • "));

        let act_label = format_ai_action(&a.action, &theme);
        let git_str = git
            .as_ref()
            .map(|g| {
                let d = if g.diff.is_empty() {
                    String::new()
                } else if theme == "thai" {
                    format!(" ✏️ {}", g.diff)
                } else {
                    format!(" [{}]", g.diff)
                };
                format!(" ({}{})", g.branch, d)
            })
            .unwrap_or_default();

        if theme == "thai" {
            details = format!("{}: {} {}", a.agent, act_label, a.target);
            state = format!("📂 {}{}", ws.workspace_name, git_str);
        } else if theme == "cyber" {
            details = format!("⚡ [{}] {} // {}", a.agent.to_uppercase(), act_label, a.target);
            state = format!("root@{} // {}{}", cfg.username, ws.workspace_name, git_str);
        } else {
            details = format!("{}: {} {}", a.agent, act_label, a.target);
            state = format!("Workspace: {}{}", ws.workspace_name, git_str);
        }
    }
    // 3. Idle / AFK Mode — STILL SHOWS WHICH PROGRAM IS LEFT OPEN!
    else if is_afk {
        let prog_label = active_prog.unwrap_or("Workspace");
        large_image = if active_prog.is_some() && lang_icon != "vscode" {
            lang_icon.to_string()
        } else {
            "idle".to_string()
        };
        if theme == "thai" {
            details = format!("☕ เปิด {} ทิ้งไว้ (AFK)", prog_label);
            state = format!("📂 {}", ws.workspace_name);
            large_text = format!("{} เปิดค้างไว้", prog_label);
        } else if theme == "cyber" {
            details = format!("💤 [STANDBY] {} Open", prog_label);
            state = format!("root@{} // {}", cfg.username, ws.workspace_name);
            large_text = "STANDBY MODE".to_string();
        } else {
            details = format!("{} (Standby)", prog_label);
            state = format!("Workspace: {}", ws.workspace_name);
            large_text = format!("{} left open", prog_label);
        }
        small_text = active_prog.unwrap_or("Idle").to_string();
    }
    // 4. Active File Editing Mode
    else if !ws.active_file.is_empty() {
        large_image = lang_icon.to_string();
        large_text = format!("Editing a {} file", lang_name);
        small_text = active_prog
            .map(|p| format!("{} • {}", p, cfg.username))
            .unwrap_or_else(|| cfg.app_name.clone());

        let git_str = git
            .as_ref()
            .map(|g| {
                let d = if g.diff.is_empty() {
                    String::new()
                } else if theme == "thai" || theme == "cozy" {
                    format!(" ✏️ {}", g.diff)
                } else {
                    format!(" [{}]", g.diff)
                };
                format!(" ({}{})", g.branch, d)
            })
            .unwrap_or_default();

        if theme == "thai" {
            details = format!("🔥 เขียนโค้ด: {}", ws.active_file);
            state = format!("📂 {}{}", ws.workspace_name, git_str);
        } else if theme == "cyber" {
            details = format!("⚡ [DEV] {} // {}", lang_name, ws.active_file);
            state = format!("root@{} // {}{}", cfg.username, ws.workspace_name, git_str);
        } else if theme == "cozy" {
            details = format!("☕ จิบกาแฟปั่น {}: {}", lang_name, ws.active_file);
            state = format!("🌱 ใน {}{}", ws.workspace_name, git_str);
        } else {
            details = format!("Editing {}", ws.active_file);
            state = format!("Workspace: {}{}", ws.workspace_name, git_str);
        }
    }
    // 5. Open Program / Terminal Mode
    else {
        let prog_label = active_prog.unwrap_or("Terminal");
        large_image = "vscode".to_string();
        large_text = format!("Using {}", prog_label);
        small_text = prog_label.to_string();
        if theme == "thai" {
            details = format!("💻 เปิด {} อยู่", prog_label);
            state = format!("📂 {}", ws.workspace_name);
        } else if theme == "cyber" {
            details = format!("💻 [ACTIVE] {} // {}", prog_label, ws.workspace_name);
            state = format!("root@{} // {}", cfg.username, ws.workspace_name);
        } else {
            details = format!("Using {}", prog_label);
            state = format!("Workspace: {}", ws.workspace_name);
        }
    }

    // Buttons (max 2)
    let mut buttons: Vec<Value> = Vec::new();
    if cfg.show_buttons {
        for b in &cfg.buttons {
            if b.url.starts_with("http") && buttons.len() < 2 {
                buttons.push(json!({
                    "label": truncate_utf8(&b.label, 32),
                    "url": truncate_utf8(&b.url, 512)
                }));
            }
        }
        if buttons.is_empty() {
            let is_thai = theme == "thai";
            let profile = if cfg.profile_url.is_empty() {
                "https://github.com/ZXD44"
            } else {
                &cfg.profile_url
            };
            if let Some(ref g) = git {
                if let Some(ref remote) = g.remote {
                    buttons.push(json!({
                        "label": if is_thai { "ดูซอร์สโค้ด" } else { "View Repository" },
                        "url": truncate_utf8(remote, 512)
                    }));
                }
            }
            if buttons.len() < 2 {
                buttons.push(json!({
                    "label": if is_thai { "โปรไฟล์ผู้พัฒนา" } else { "View Profile" },
                    "url": truncate_utf8(profile, 512)
                }));
            }
            if buttons.len() < 2 {
                buttons.push(json!({
                    "label": if is_thai { "Zircord Repository" } else { "View Zircord" },
                    "url": "https://github.com/ZXD44/Zircord"
                }));
            }
        }
    }

    let mut activity = json!({
        "instance": false,
        "timestamps": { "start": start_ts }
    });
    if details.trim().len() >= 2 {
        activity["details"] = json!(truncate_utf8(details.trim(), 128));
    }
    if state.trim().len() >= 2 {
        activity["state"] = json!(truncate_utf8(state.trim(), 128));
    }
    let mut assets = serde_json::Map::new();
    if !large_image.is_empty() {
        assets.insert("large_image".into(), json!(truncate_utf8(&large_image, 128)));
    }
    if large_text.trim().len() >= 2 {
        assets.insert("large_text".into(), json!(truncate_utf8(large_text.trim(), 128)));
    }
    assets.insert("small_image".into(), json!(small_image));
    if small_text.trim().len() >= 2 {
        assets.insert("small_text".into(), json!(truncate_utf8(small_text.trim(), 128)));
    }
    activity["assets"] = Value::Object(assets);
    if !buttons.is_empty() {
        activity["buttons"] = Value::Array(buttons);
    }

    let _ = (user_home, SystemTime::now());
    activity
}
