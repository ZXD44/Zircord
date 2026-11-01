# Changelog

All notable changes to the **Clicord** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.3.0] - 2026-11-01

### Added
- **CLI Daemon Management**: Added `clicord start`, `clicord stop`, `clicord status`, and `clicord --help` commands with PID tracking.
- **Cross-Platform IPC Engine**: Seamless support for Linux and macOS Unix domain sockets (`/tmp/discord-ipc-0` / `$XDG_RUNTIME_DIR`) alongside Windows named pipes.
- **Terminal Editor Auto-Detection**: Real-time process scanning for active terminal editors (`Neovim`, `Vim`, `Helix`, `Micro`, `Nano`).
- Restored username `👤 ZirconX` alongside dedicated Git metrics on Line 2.

---

## [1.2.0] - 2026-11-01

### Added
- **Dynamic Application Client ID Switching**: Seamless support for custom Client IDs via `clicord.json`, falling back to official Visual Studio Code (`383226320970055681`) or automatic Roblox Studio (`1199942284653903882`).
- **Bloxstrap & Roblox Studio Support**: Native process inspection via `tasklist`, log reading in `%LOCALAPPDATA%\Roblox\logs` for place names, and Rojo `default.project.json` detection.
- **Dedicated Git Stats Line**: Clean separation of Git branch, dirty file count, and real-time diff metrics `[+ins/-del]` onto Line 2.
- **Fire Emoji (🔥)**: Replaced default lightning bolt with dynamic high-energy fire styling for the Thai theme.

### Changed
- Reorganized presence layout so Line 2 focuses purely on Git metrics without being cramped by the user handle.
- Improved AFK timeout resolution and memory cleanup.

---

## [1.1.0] - 2026-10-31

### Added
- **Multi-Theme Engine**: Added `thai`, `modern`, `cyber`, and `cozy` theme templates.
- **Universal Configuration Loader**: Dynamic fallback to `clicord.json` at local workspace or global `~/.gemini/` path.
- **Automated Install Scripts**: Single-click `install.ps1` and `uninstall.ps1` with automatic PATH setup and Rust shim compilation.

---

## [1.0.0] - 2026-10-30

### Initial Release
- Zero-dependency Discord Rich Presence IPC daemon using native Node.js socket streams.
- Native Rust wrapper shim (`bin/agy.exe`) for transparent background spawning.
- Smart context detection for Antigravity AI agent logs and workspace file modifications.
