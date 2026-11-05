# Changelog

All notable changes to the **Zircord** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [3.0.0] - 2026-11-05

### Added
- **vscord 1:1 Aesthetic**: Complete layout, details, state, timestamps, and asset mapping aligned with [LeonardSSH/vscord](https://open-vsx.org/extension/LeonardSSH/vscord).
- **Multi-Theme Engine**: Added `"vscord"` (clean minimalist VS Code default) alongside `"thai"`, `"cyber"`, and `"cozy"`.
- **Smart Git Root Resolver**: Implemented `findGitRoot()` to traverse project trees and completely skip executing git commands when outside git repos.
- **UTF-8 Byte Boundary Truncation**: Added `truncateUtf8()` enforcing Discord's strict 128-byte limit across all payload strings to prevent silent packet drops.

### Changed
- **Zero-Bloat Architecture (LessLOC)**: Trimmed codebase from 1,443 lines to ~590 lines (over 60% code reduction) eliminating duplicate loops and redundant handlers.
- **Throttled Process Polling**: Throttled process inspection intervals to 12s, cutting CPU churn and memory footprint.
- **Upgraded Schema**: Added `"vscord"` to `config/zircord.schema.json`.

### Fixed
- **Windows Console Window Popups**: Replaced all shell `exec()` calls with direct `execFile()` using `{ windowsHide: true }`, permanently eliminating black `cmd.exe` / `conhost.exe` flashing windows.
- **Single-Instance Mutex**: Redesigned PID lock with atomic cleanup to prevent zombie daemons and duplicate background processes.
- **Socket Stream Resilience**: Hardened Discord IPC connection with exponential backoff on pipe disconnections (`\\.\pipe\discord-ipc-0..9`).

---

## [2.1.0] - 2026-11-01

### Added
- **Ultra-Compact Thai Theme Layout**: Redesigned Line 2 to display subfolder path (`📂 src/`, `📂 root`), Git branch, and per-file diff stats (`(master) ✏️ +14 -2` / `(master) ✨ ใหม่`) in only 19–26 characters, completely preventing mobile Discord card truncation.
- **Per-File Git Diff Engine**: Added `getGitDiffStatsForFile()` targeting `git diff HEAD --shortstat -- <file>` for accurate, file-specific diff counts instead of whole-repo totals.
- **100% Thai Interactive Buttons**: Renamed default Rich Presence buttons to Thai without English (`[ ดูซอร์สโค้ด ]` and `[ โปรไฟล์ผู้พัฒนา ]`, falling back to `[ ติดตามผลงาน ]`).
- **New AI Agent & CLI Shims**: Added detection and command wrappers for Kiro (`kiro`, `kiro-cli`), Gemini CLI (`gemini`), Cursor Agent (`cursor-agent`), and Windsurf (`windsurf`).
- **Comprehensive Agent Manual (`.agent/`)**: Added complete architecture docs, rules, and workflows under `.agent/` (`rules.md`, `systems.md`, `workflows.md`, `README.md`).

### Fixed
- **Git Porcelain Status Parsing**: Fixed leading whitespace slicing issue in `git status --porcelain` that was stripping the first character of modified file paths (`rc/...`).
- **Missing `getKiroActivity` Reference**: Resolved `ReferenceError: getKiroActivity is not defined` when running `zircord status`.

---

## [2.0.1] - 2026-11-01

### Fixed
- **Duplicate User Handle in State**: Fixed issue where daemon running in User Profile directory (`%USERPROFILE%`) produced `ZirconX @ ZirconX`; now automatically sanitizes root user folders to `เทอร์มินัล`.
- **Mobile Discord Truncation**: Redesigned Thai layout for mobile screens—condensed Line 1 (`🔥 เขียนโค้ด: file.ext`) and Line 2 (`📁 Folder (branch) • ✏️ +ins -del`) to prevent ellipsis (`...`) on narrow cards.
- **Diff Metric Aesthetics**: Redesigned Git diff stats from `+ins/-del` to clean `✏️ +ins -del`.
- **Interactive Buttons**: Guaranteed 2 persistent buttons in 100% Thai without emojis (`ดูโค้ดบน GitHub`, `โปรไฟล์ ZirconX`, `โปรเจกต์ Zircord`) when other users view the profile card.
- **Custom Buttons**: Added `buttons` array support to `config/zircord.schema.json`.

---

## [2.0.0] - 2026-11-01

### Changed
- **Rebranded to Zircord**: Official signature project naming by ZirconX.
- Renamed CLI commands to `zircord` (retaining `clicord` as an alias for backwards compatibility).
- Configuration now loads `zircord.json` with fallback to `clicord.json`.
- State file moved to `zircord.pid`.

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
