use std::process::{Command, Stdio};
use std::os::windows::process::CommandExt;
use std::env;
use std::path::Path;

const CREATE_NO_WINDOW: u32 = 0x08000000;

fn main() {
    let args: Vec<String> = env::args().skip(1).collect();
    let userprofile = env::var("USERPROFILE").unwrap_or_default();
    let localappdata = env::var("LOCALAPPDATA").unwrap_or_default();

    // Priority order to locate discord-rpc.js on ANY user's machine:
    let candidate_1 = env::var("CLICORD_SCRIPT").unwrap_or_default();
    let candidate_2 = format!(r"{}\Documents\clicord\src\discord-rpc.js", userprofile);
    let candidate_3 = format!(r"{}\.gemini\scripts\discord-rpc.js", userprofile);
    let candidate_4 = r"src\discord-rpc.js".to_string();

    let rpc_script = if !candidate_1.is_empty() && Path::new(&candidate_1).exists() {
        Some(candidate_1)
    } else if Path::new(&candidate_2).exists() {
        Some(candidate_2)
    } else if Path::new(&candidate_3).exists() {
        Some(candidate_3)
    } else if Path::new(&candidate_4).exists() {
        Some(candidate_4)
    } else {
        None
    };

    let real_agy = format!(r"{}\agy\bin\agy.exe", localappdata);
    let cwd = env::current_dir().unwrap_or_default();

    // Spawn background Node RPC daemon with hidden window
    let rpc_child = if let Some(ref script_path) = rpc_script {
        Command::new("node")
            .arg(script_path)
            .arg(&cwd)
            .creation_flags(CREATE_NO_WINDOW)
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .ok()
    } else {
        None
    };

    // Run real agy executable with raw inherited stdio (interactive TUI)
    let target_bin = if Path::new(&real_agy).exists() {
        real_agy
    } else {
        "agy.exe".to_string()
    };

    let status = Command::new(&target_bin)
        .args(&args)
        .stdin(Stdio::inherit())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .status();

    // Kill RPC daemon immediately when agy exits
    if let Some(mut child) = rpc_child {
        let _ = child.kill();
    }

    // Forward original exit code
    if let Ok(st) = status {
        if let Some(code) = st.code() {
            std::process::exit(code);
        }
    }
}
