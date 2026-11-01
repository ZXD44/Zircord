# 🤖 Zircord Agent Operating Manual

เอกสารกลางสำหรับ AI Agents ในการทำความเข้าใจสถาปัตยกรรมระบบ, โครงสร้างไฟล์, กลไกการตรวจจับ และ **กฎเหล็ก (Rules)** ที่ต้องปฏิบัติตามเมื่อพัฒนา ปรับแต่ง หรือแก้ปัญหาในโปรเจกต์ **Zircord**

---

## 📑 สารบัญเอกสาร (Agent Knowledge Base)

1. [กฎเหล็กและแนวทางปฏิบัติ (Mandatory Rules)](./rules.md)
   * กฎด้านสถาปัตยกรรม (Zero Dependencies, Performance, Non-blocking)
   * กฎการจัดการพาธและระบบปฏิบัติการ (Cross-Platform)
   * กฎการพาร์ส Git Status และความเสถียร
   * กฎการซิงก์ไฟล์และรีสตาร์ต Daemon
   * กฎการจัดวางข้อความบน Discord Card (Mobile-friendly)

2. [คู่มือระบบภายในและการตรวจจับ (Systems Architecture)](./systems.md)
   * ระบบแกนกลาง (Core IPC Engine & Socket Stream)
   * ระบบตั้งค่าและการสืบทอด (Configuration Precedence)
   * ระบบตรวจจับ AI Agents (Freebuff, Kiro, Antigravity, Claude, Cursor ฯลฯ)
   * ระบบตรวจจับ Roblox Studio & Rojo
   * ระบบตรวจจับ Text Editors, CLI Tools & Shells
   * กลไก Git Tracking & Per-File Diff Engine
   * ระบบธีมและเลย์เอาต์ (Thai, Modern, Cyber, Cozy)

3. [เวิร์กโฟลว์และคำสั่ง (Workflows & Lifecycle)](./workflows.md)
   * วงจรชีวิตของ Daemon (Start, Stop, Status, Run)
   * ระบบ Shims และ CLI Wrappers
   * การติดตั้งและกระจายไฟล์ (`install.ps1`, `~/.gemini/`)
   * การทดสอบและดีบักระบบ

---

## 🗺️ แผนผังระบบภาพรวม (System Map)

```text
[ Developer Environment ]
  ├── Active Files (VS Code / Neovim / Helix)
  ├── Git Repo (Branch, Porcelain Status, Per-File Diff)
  ├── Active CLIs & Agents (Freebuff, Kiro, Antigravity, Cargo, Bun)
  └── Roblox Studio (Place Logs / Rojo default.project.json)
              │
              ▼
   [ src/discord-rpc.js (Daemon) ]
  ├── ⚙️ Universal Config Loader (cwd -> ~/.gemini/zircord.json)
  ├── ⚡ Async Process Scanner (tasklist / ps non-blocking cache)
  ├── 🔍 Multi-Agent & Tool Detectors
  ├── 🌿 Git & Subfolder Diff Engine
  └── 🎨 Theme Formatter (Line 1: Details, Line 2: State, Buttons)
              │
              ▼ (Opcode 0 Handshake, Opcode 1 Frame)
   [ \\.\pipe\discord-ipc-0..9 หรือ /tmp/discord-ipc-0..9 ]
              │
              ▼
      [ Discord Desktop App ]
```
