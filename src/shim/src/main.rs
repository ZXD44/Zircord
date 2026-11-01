use std::process::{Command, Stdio};
use std::os::windows::process::CommandExt;
use std::env;
use std::path::Path;

const CREATE_NO_WINDOW: u32 = 0x08000000;

fn main() {
    let raw_args: Vec<String> = env::args().skip(1).collect();
    let userprofile = env::var("USERPROFILE").unwrap_or_default();
    let localappdata = env::var("LOCALAPPDATA").unwrap_or_default();

    // Priority order to locate discord-rpc.js on ANY user's machine:
    let candidate_1 = env::var("ZIRCORD_SCRIPT").or_else(|_| env::var("CLICORD_SCRIPT")).unwrap_or_default();
    let candidate_2 = format!(r"{}\Documents\zircord\src\discord-rpc.js", userprofile);
    let candidate_2b = format!(r"{}\Documents\clicord\src\discord-rpc.js", userprofile);
    let candidate_3 = format!(r"{}\.gemini\scripts\discord-rpc.js", userprofile);
    let candidate_4 = r"src\discord-rpc.js".to_string();

    let rpc_script = if !candidate_1.is_empty() && Path::new(&candidate_1).exists() {
        Some(candidate_1)
    } else if Path::new(&candidate_2).exists() {
        Some(candidate_2)
    } else if Path::new(&candidate_2b).exists() {
        Some(candidate_2b)
    } else if Path::new(&candidate_3).exists() {
        Some(candidate_3)
    } else if Path::new(&candidate_4).exists() {
        Some(candidate_4)
    } else {
        None
    };

    let current_exe = env::current_exe().unwrap_or_default();
    let stem = current_exe
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("zircord")
        .to_lowercase();

    let cwd = env::current_dir().unwrap_or_default();

    // Determine target binary & forwarded args based on how shim was called
    let (target_bin, final_args, should_kill_rpc) = if stem == "freebuff" {
        let manicode_bin = format!(r"{}\.config\manicode\freebuff.exe", userprofile);
        let target = if Path::new(&manicode_bin).exists() {
            manicode_bin
        } else {
            "freebuff.exe".to_string()
        };
        (target, raw_args, true)
    } else if stem == "agy" {
        let real_agy = format!(r"{}\agy\bin\agy.exe", localappdata);
        let alt_agy = format!(r"{}\.gemini\antigravity-cli\bin\agy.exe", userprofile);
        let target = if Path::new(&real_agy).exists() {
            real_agy
        } else if Path::new(&alt_agy).exists() {
            alt_agy
        } else {
            "agy.exe".to_string()
        };
        (target, raw_args, true)
    } else if stem == "claude" {
        ("claude.exe".to_string(), raw_args, true)
    } else if !raw_args.is_empty() && raw_args[0] == "run" {
        let cmd = raw_args[1].clone();
        let pass_through = raw_args[2..].to_vec();
        (cmd, pass_through, true)
    } else if let Some(ref script_path) = rpc_script {
        let mut forward = vec![script_path.clone()];
        forward.extend(raw_args);
        ("node".to_string(), forward, false)
    } else {
        ("node".to_string(), raw_args, false)
    };

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

    let status = Command::new(&target_bin)
        .args(&final_args)
        .stdin(Stdio::inherit())
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .status();

    if should_kill_rpc {
        if let Some(mut child) = rpc_child {
            let _ = child.kill();
        }
    }

    if let Ok(st) = status {
        if let Some(code) = st.code() {
            std::process::exit(code);
        }
    }
}
