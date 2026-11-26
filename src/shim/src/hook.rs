use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct ClaudeHookState {
    #[serde(default)]
    pub session_id: String,
    #[serde(default)]
    pub event: String,
    #[serde(default)]
    pub action: String,
    #[serde(default)]
    pub target: String,
    #[serde(default)]
    pub cwd: String,
    #[serde(default)]
    pub model: String,
    #[serde(default)]
    pub tool_count: u64,
    #[serde(default)]
    pub timestamp: u64,
}

pub fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

pub fn state_file_path(user_home: &Path) -> PathBuf {
    user_home.join(".gemini").join("zircord-claude.json")
}

fn base_name(p: &str) -> String {
    Path::new(p)
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or(p)
        .to_string()
}

fn summarize_tool(tool_name: &str, input: &Value) -> (String, String) {
    match tool_name {
        "Edit" | "Write" | "MultiEdit" | "NotebookEdit" => {
            let p = input["file_path"]
                .as_str()
                .or_else(|| input["notebook_path"].as_str())
                .unwrap_or("");
            let target = if p.is_empty() {
                "Code".to_string()
            } else {
                base_name(p)
            };
            ("Writing".to_string(), target)
        }
        "Read" => {
            let p = input["file_path"].as_str().unwrap_or("");
            let target = if p.is_empty() {
                "File".to_string()
            } else {
                base_name(p)
            };
            ("Reading".to_string(), target)
        }
        "Grep" | "Glob" => {
            let q = input["pattern"]
                .as_str()
                .map(|s| s.to_string())
                .or_else(|| input["path"].as_str().map(base_name))
                .unwrap_or_else(|| "Codebase".to_string());
            ("Searching".to_string(), q.chars().take(36).collect())
        }
        "Bash" => {
            let cmd = input["command"]
                .as_str()
                .unwrap_or("")
                .trim()
                .lines()
                .next()
                .unwrap_or("Command");
            ("Running".to_string(), cmd.chars().take(36).collect())
        }
        "WebFetch" | "WebSearch" | "Agent" | "Task" => {
            let desc = input["description"].as_str().unwrap_or(tool_name);
            ("Researching".to_string(), desc.chars().take(36).collect())
        }
        _ => {
            let clean = tool_name.strip_prefix("mcp__").unwrap_or(tool_name);
            let target: String = clean.chars().take(36).collect();
            (
                "Using".to_string(),
                if target.is_empty() {
                    "Tool".to_string()
                } else {
                    target
                },
            )
        }
    }
}

pub fn run_hook(user_home: &Path) {
    let mut raw = String::new();
    if std::io::stdin().read_to_string(&mut raw).is_err() || raw.trim().is_empty() {
        return;
    }
    let Ok(payload) = serde_json::from_str::<Value>(&raw) else {
        return;
    };

    let evt = payload["hook_event_name"].as_str().unwrap_or("");
    let state_path = state_file_path(user_home);

    if evt == "SessionEnd" {
        let _ = fs::remove_file(&state_path);
        return;
    }

    let prev: ClaudeHookState = fs::read_to_string(&state_path)
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default();

    let session_id = payload["session_id"]
        .as_str()
        .unwrap_or(&prev.session_id)
        .to_string();
    let same_session = !prev.session_id.is_empty() && prev.session_id == session_id;
    let mut tool_count = if same_session { prev.tool_count } else { 0 };
    let mut action = if prev.action.is_empty() {
        "Assisting".to_string()
    } else {
        prev.action
    };
    let mut target = if prev.target.is_empty() {
        "Workspace".to_string()
    } else {
        prev.target
    };

    match evt {
        "UserPromptSubmit" => {
            action = "Thinking".to_string();
            target = "Prompt".to_string();
        }
        "PreToolUse" => {
            tool_count += 1;
            let (a, t) = summarize_tool(
                payload["tool_name"].as_str().unwrap_or(""),
                &payload["tool_input"],
            );
            action = a;
            target = t;
        }
        "PostToolUse" => {
            let (a, t) = summarize_tool(
                payload["tool_name"].as_str().unwrap_or(""),
                &payload["tool_input"],
            );
            action = a;
            target = t;
        }
        "Stop" => {
            action = "Waiting".to_string();
            target = "Prompt".to_string();
        }
        _ => {}
    }

    let state = ClaudeHookState {
        session_id,
        event: evt.to_string(),
        action,
        target,
        cwd: payload["cwd"].as_str().unwrap_or(&prev.cwd).to_string(),
        model: payload["model"]
            .as_str()
            .unwrap_or(&prev.model)
            .to_string(),
        tool_count,
        timestamp: now_ms(),
    };

    if let Some(parent) = state_path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    if let Ok(json_str) = serde_json::to_string(&state) {
        let tmp = state_path.with_extension("json.tmp");
        if fs::write(&tmp, json_str).is_ok() {
            let _ = fs::rename(&tmp, &state_path);
        }
    }
}
