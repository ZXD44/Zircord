# Zircord Architecture

This document describes the high-level architecture and internal mechanics of **Zircord**.

---

## 🏛️ High-Level System Architecture

```text
+-----------------------------------------------------------+
|                      User Environment                     |
|  (Terminal / PowerShell / CMD / Git Bash / Roblox Studio) |
+-----------------------------+-----------------------------+
                              |
                     Auto-Hooks / Commands
                     (zircord / agy / boot)
                              |
                              v
             +---------------------------------+
             |   Zircord Native Rust Core      |
             |   (bin/zircord.exe ~371 KB)     |
             +----------------+----------------+
                              |
       +----------------------+----------------------+
       |                      |                      |
       v                      v                      v
+--------------+      +---------------+      +---------------+
| Git Tracker  |      | Win32 Proc    |      | Claude Hook   |
| Branch, Diff |      | ToolHelp32    |      | & AGY Logs    |
+-------+------+      +-------+-------+      +-------+-------+
        \                     |                     /
         \                    |                    /
          +-------------------+-------------------+
                              |
                     Payload Formatter
                     (Themes & Standby)
                              |
                              v
             +---------------------------------+
             |   Native Windows Named Pipe     |
             |   \\.\pipe\discord-ipc-0..9     |
             +----------------+----------------+
                              |
                              v
                     Discord Desktop App
```

---

## 🔌 Modules & Directory Structure

* **`bin/`**: Native Rust multi-call binary (`zircord.exe`) + CLI wrappers.
* **`config/`**: Configuration schema and presets (`thai`, `cyber`, `modern`, `roblox-dev`).
* **`docs/`**: Project documentation, guides, changelogs, and contribution rules.
* **`scripts/`**: PowerShell installer/uninstaller and Startup VBS launcher (`start-daemon.vbs`).
* **`src/`**: Native Rust core (`src/shim/src/` -> `main.rs`, `win.rs`, `ipc.rs`, `hook.rs`, `presence.rs`) and legacy Node.js fallback (`src/discord-rpc.js`).

---

## ⚡ Native Rust Zero-Bloat Runtime
* `std::fs::OpenOptions`: Direct Named Pipe (`\\.\pipe\discord-ipc-0..9`) IPC framing (Opcode 0 Handshake, Opcode 1 Frame).
* `windows-sys` (`CreateToolhelp32Snapshot`): Zero-spawn process monitoring in memory.
* `zircord hook`: Sub-2ms Claude Code stdin hook writer (`~/.gemini/zircord-claude.json`).
