use std::collections::HashSet;
use std::ffi::CStr;
use std::os::windows::process::CommandExt;
use std::path::Path;
use std::process::{Command, Stdio};

use windows_sys::Win32::Foundation::{CloseHandle, INVALID_HANDLE_VALUE};
use windows_sys::Win32::System::Diagnostics::ToolHelp::{
    CreateToolhelp32Snapshot, Process32First, Process32Next, PROCESSENTRY32, TH32CS_SNAPPROCESS,
};
use windows_sys::Win32::System::Threading::{
    OpenProcess, TerminateProcess, PROCESS_QUERY_LIMITED_INFORMATION, PROCESS_TERMINATE,
};

pub const CREATE_NO_WINDOW: u32 = 0x0800_0000;

/// Snapshot all running process names (lowercased) using Win32 ToolHelp32 (zero subprocesses).
pub fn snapshot_processes() -> HashSet<String> {
    let mut set = HashSet::new();
    unsafe {
        let snap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
        if snap == INVALID_HANDLE_VALUE {
            return set;
        }
        let mut entry: PROCESSENTRY32 = std::mem::zeroed();
        entry.dwSize = std::mem::size_of::<PROCESSENTRY32>() as u32;
        if Process32First(snap, &mut entry) != 0 {
            loop {
                let bytes: Vec<u8> = entry
                    .szExeFile
                    .iter()
                    .take_while(|&&c| c != 0)
                    .map(|&c| c as u8)
                    .collect();
                if let Ok(name) = std::str::from_utf8(&bytes) {
                    set.insert(name.to_lowercase());
                } else if let Ok(cstr) = CStr::from_bytes_until_nul(
                    &entry.szExeFile.iter().map(|&c| c as u8).collect::<Vec<u8>>(),
                ) {
                    set.insert(cstr.to_string_lossy().to_lowercase());
                }
                if Process32Next(snap, &mut entry) == 0 {
                    break;
                }
            }
        }
        CloseHandle(snap);
    }
    set
}

pub fn is_pid_alive(pid: u32) -> bool {
    if pid == 0 {
        return false;
    }
    unsafe {
        let h = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid);
        if h.is_null() {
            return false;
        }
        CloseHandle(h);
        true
    }
}

pub fn kill_pid(pid: u32) -> bool {
    if pid == 0 || pid == std::process::id() {
        return false;
    }
    unsafe {
        let h = OpenProcess(PROCESS_TERMINATE, 0, pid);
        if h.is_null() {
            return false;
        }
        let ok = TerminateProcess(h, 0) != 0;
        CloseHandle(h);
        ok
    }
}

/// Kill any other running zircord.exe or legacy node discord-rpc.js daemon.
pub fn kill_other_zircord_daemons() -> bool {
    let my_pid = std::process::id();
    let mut killed = false;
    unsafe {
        let snap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
        if snap != INVALID_HANDLE_VALUE {
            let mut entry: PROCESSENTRY32 = std::mem::zeroed();
            entry.dwSize = std::mem::size_of::<PROCESSENTRY32>() as u32;
            if Process32First(snap, &mut entry) != 0 {
                loop {
                    let name: String = entry
                        .szExeFile
                        .iter()
                        .take_while(|&&c| c != 0)
                        .map(|&c| (c as u8 as char).to_ascii_lowercase())
                        .collect();
                    if name == "zircord.exe" && entry.th32ProcessID != my_pid {
                        if kill_pid(entry.th32ProcessID) {
                            killed = true;
                        }
                    }
                    if Process32Next(snap, &mut entry) == 0 {
                        break;
                    }
                }
            }
            CloseHandle(snap);
        }
    }
    killed
}

pub fn spawn_hidden_daemon(exe: &Path, target_dir: &Path) -> std::io::Result<u32> {
    let child = Command::new(exe)
        .arg("--daemon")
        .arg(target_dir)
        .current_dir(target_dir)
        .creation_flags(CREATE_NO_WINDOW)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()?;
    Ok(child.id())
}

pub fn run_silent(program: &str, args: &[&str], cwd: Option<&Path>) -> Option<String> {
    let mut cmd = Command::new(program);
    cmd.args(args)
        .creation_flags(CREATE_NO_WINDOW)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::null());
    if let Some(dir) = cwd {
        cmd.current_dir(dir);
    }
    let out = cmd.output().ok()?;
    if !out.status.success() {
        return None;
    }
    Some(String::from_utf8_lossy(&out.stdout).trim().to_string())
}
