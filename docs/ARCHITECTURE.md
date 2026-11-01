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
             |   Zircord Core RPC Engine       |
             |   (src/discord-rpc.js)          |
             +----------------+----------------+
                              |
       +----------------------+----------------------+
       |                      |                      |
       v                      v                      v
+--------------+      +---------------+      +---------------+
| Git Tracker  |      | Process Hook  |      | Brain Monitor |
| Branch, Diff |      | Roblox/Neovim |      | AI Agent Logs |
+-------+------+      +-------+-------+      +-------+-------+
        \                     |                     /
         \                    |                    /
          +-------------------+-------------------+
                              |
                     Payload Formatter
                     (Themes & Layouts)
                              |
                              v
             +---------------------------------+
             |   Platform IPC Socket Stream    |
             | Windows: \\.\pipe\discord-ipc-X |
             | Linux/macOS: /tmp/discord-ipc-X |
             +----------------+----------------+
                              |
                              v
                     Discord Desktop App
```

---

## 🔌 Modules & Directory Structure

* **`bin/`**: Universal command line launchers (`zircord`, `zircord.cmd`, `clicord`, `clicord.cmd`) and the native Rust shim `bin/agy.exe`.
* **`config/`**: Configuration schema and presets (`thai`, `cyber`, `modern`, `roblox-dev`).
* **`docs/`**: Project documentation, guides, changelogs, and contribution rules.
* **`scripts/`**: PowerShell scripts for installation and uninstallation.
* **`src/`**: Primary Node.js Discord RPC daemon and Rust shim source.

---

## ⚡ Zero External Dependencies
Zircord achieves maximum stability and zero-friction installation by relying exclusively on built-in Node.js libraries:
* `net`: Direct raw IPC socket streams (Opcode 0 Handshake, Opcode 1 Frame).
* `child_process`: Lightweight, non-blocking process inspection (`tasklist`, `git status`).
* `fs` & `path`: Safe configuration and workspace activity monitoring.
