mod hook;
mod ipc;
mod presence;
mod win;

use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::thread;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use ipc::DiscordIpc;
use presence::{build_activity, detect_ai_activity, load_config, VSCODE_CLIENT_ID};
use win::{
    is_pid_alive, kill_other_zircord_daemons, kill_pid, snapshot_processes, spawn_hidden_daemon,
};

#[derive(Debug, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct PidInfo {
    pid: u32,
    target_dir: String,
    started_at: u64,
}

fn user_home_dir() -> PathBuf {
    env::var("USERPROFILE")
        .or_else(|_| env::var("HOME"))
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("."))
}

fn pid_file_path(user_home: &Path) -> PathBuf {
    user_home.join(".gemini").join("zircord.pid")
}

fn read_pid_info(user_home: &Path) -> Option<PidInfo> {
    let raw = fs::read_to_string(pid_file_path(user_home)).ok()?;
    serde_json::from_str(&raw).ok()
}

fn write_pid_info(user_home: &Path, target_dir: &Path) {
    let p = pid_file_path(user_home);
    if let Some(parent) = p.parent() {
        let _ = fs::create_dir_all(parent);
    }
    let info = PidInfo {
        pid: std::process::id(),
        target_dir: target_dir.to_string_lossy().to_string(),
        started_at: hook::now_ms(),
    };
    if let Ok(s) = serde_json::to_string(&info) {
        let _ = fs::write(p, s);
    }
}

fn run_daemon(target_dir: PathBuf) {
    let user_home = user_home_dir();
    if let Some(prev) = read_pid_info(&user_home) {
        if prev.pid != std::process::id() && is_pid_alive(prev.pid) {
            kill_pid(prev.pid);
        }
    }
    write_pid_info(&user_home, &target_dir);

    let cfg = load_config(&target_dir, &user_home);
    let client_id = if cfg.client_id.is_empty() {
        VSCODE_CLIENT_ID.to_string()
    } else {
        cfg.client_id.clone()
    };

    let mut rpc = DiscordIpc::new(client_id);
    let start_ts = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    let mut last_activity_ms = hook::now_ms();
    let mut nonce: u64 = 1;

    loop {
        let procs = snapshot_processes();
        let cfg = load_config(&target_dir, &user_home);
        let ai = if cfg.enable_agent_detection {
            detect_ai_activity(&user_home, &procs)
        } else {
            None
        };
        if let Some(ref a) = ai {
            if a.timestamp > last_activity_ms {
                last_activity_ms = a.timestamp;
            }
        }
        let afk_limit_ms = cfg.afk_timeout_minutes.saturating_mul(60_000);
        let is_afk = afk_limit_ms > 0 && hook::now_ms().saturating_sub(last_activity_ms) > afk_limit_ms;

        let activity = build_activity(
            &cfg,
            &target_dir,
            &user_home,
            start_ts,
            is_afk,
            ai.as_ref(),
            &procs,
        );
        if !rpc.set_activity(&activity, nonce) {
            // Wait before retry if Discord isn't open yet
            thread::sleep(Duration::from_secs(5));
        }
        nonce = nonce.wrapping_add(1);
        thread::sleep(Duration::from_secs(5));
    }
}

fn ensure_daemon_running(exe: &Path, target_dir: &Path, user_home: &Path) {
    let running = read_pid_info(user_home)
        .map(|i| is_pid_alive(i.pid))
        .unwrap_or(false);
    if !running {
        let _ = spawn_hidden_daemon(exe, target_dir);
    }
}

fn main() {
    let args: Vec<String> = env::args().skip(1).collect();
    let user_home = user_home_dir();
    let current_exe = env::current_exe().unwrap_or_else(|_| PathBuf::from("zircord.exe"));
    let stem = current_exe
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("zircord")
        .to_lowercase();
    let cwd = env::current_dir().unwrap_or_else(|_| user_home.clone());

    // Shim Mode (when invoked via renamed binary like claude.exe / freebuff.exe / agy.exe)
    if matches!(stem.as_str(), "claude" | "freebuff" | "agy" | "cursor" | "aider") {
        let _ = spawn_hidden_daemon(&current_exe, &cwd);
        let real_bin = match stem.as_str() {
            "freebuff" => {
                let p = user_home.join(".config").join("manicode").join("freebuff.exe");
                if p.exists() { p.to_string_lossy().to_string() } else { "freebuff.exe".into() }
            }
            "agy" => {
                let local = env::var("LOCALAPPDATA").unwrap_or_default();
                let p1 = PathBuf::from(&local).join("agy").join("bin").join("agy.exe");
                let p2 = user_home.join(".gemini").join("antigravity-cli").join("bin").join("agy.exe");
                if p1.exists() { p1.to_string_lossy().to_string() }
                else if p2.exists() { p2.to_string_lossy().to_string() }
                else { "agy.exe".into() }
            }
            other => format!("{}.exe", other),
        };
        let status = Command::new(&real_bin)
            .args(&args)
            .stdin(Stdio::inherit())
            .stdout(Stdio::inherit())
            .stderr(Stdio::inherit())
            .status();
        std::process::exit(status.ok().and_then(|s| s.code()).unwrap_or(0));
    }

    let cmd = args.first().map(|s| s.to_lowercase()).unwrap_or_default();
    match cmd.as_str() {
        "--daemon" => {
            let target = args.get(1).map(PathBuf::from).unwrap_or(cwd);
            run_daemon(target);
        }
        "hook" => {
            hook::run_hook(&user_home);
        }
        "stop" => {
            let mut stopped = false;
            if let Some(info) = read_pid_info(&user_home) {
                if kill_pid(info.pid) {
                    stopped = true;
                }
                let _ = fs::remove_file(pid_file_path(&user_home));
            }
            if kill_other_zircord_daemons() {
                stopped = true;
            }
            println!(
                "{}",
                if stopped {
                    "✅ Zircord daemon stopped."
                } else {
                    "ℹ️ No running Zircord daemon found."
                }
            );
        }
        "status" => {
            println!("🌌 Zircord (Native Rust v2) Status:");
            if let Some(info) = read_pid_info(&user_home) {
                if is_pid_alive(info.pid) {
                    let cfg = load_config(Path::new(&info.target_dir), &user_home);
                    println!("  ● Daemon:      RUNNING (PID: {})", info.pid);
                    println!("  ● Monitoring:  {}", info.target_dir);
                    println!("  ● Theme:       {}", cfg.theme);
                    return;
                }
            }
            println!("  ○ Daemon:      STOPPED");
            println!("  💡 Run 'zircord start' to launch in background.");
        }
        "start" => {
            let target = args
                .get(1)
                .map(|p| fs::canonicalize(p).unwrap_or_else(|_| PathBuf::from(p)))
                .unwrap_or(cwd);
            if let Ok(pid) = spawn_hidden_daemon(&current_exe, &target) {
                println!("🚀 Zircord Native daemon started (PID: {}).", pid);
                println!("📁 Monitoring: {}", target.display());
            } else {
                eprintln!("❌ Failed to start Zircord daemon.");
                std::process::exit(1);
            }
        }
        "run" => {
            if args.len() < 2 {
                println!("Usage: zircord run <command> [args...]");
                std::process::exit(1);
            }
            ensure_daemon_running(&current_exe, &cwd, &user_home);
            let status = Command::new(&args[1])
                .args(&args[2..])
                .stdin(Stdio::inherit())
                .stdout(Stdio::inherit())
                .stderr(Stdio::inherit())
                .status();
            std::process::exit(status.ok().and_then(|s| s.code()).unwrap_or(0));
        }
        "--help" | "-h" | "help" => {
            println!(
                "💎 Zircord (Native Rust v2) - Ultra-Lightweight Discord Rich Presence\n\
                 Usage:\n  \
                   zircord start [path]         Start background daemon silently\n  \
                   zircord stop                 Stop running daemon\n  \
                   zircord status               Show daemon status\n  \
                   zircord run <cmd> [args...]  Run any CLI with active presence\n  \
                   zircord hook                 Claude Code hook bridge (stdin JSON)"
            );
        }
        _ => {
            let target = args
                .first()
                .filter(|p| Path::new(p).exists())
                .map(PathBuf::from)
                .unwrap_or(cwd);
            run_daemon(target);
        }
    }
}
