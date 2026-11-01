<div align="center">

# 🌌 AgyCord

**Intelligent, real-time Discord Rich Presence for Google Antigravity CLI (`agy`)**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows-lightgrey.svg?style=flat-square)]()
[![Runtime](https://img.shields.io/badge/Node.js-18%2B-green.svg?style=flat-square)]()
[![Built with Rust](https://img.shields.io/badge/Built%20With-Rust-orange.svg?style=flat-square)]()
[![Shell Support](https://img.shields.io/badge/Shell-wt%20%7C%20cmd%20%7C%20pwsh%20%7C%20bash-purple.svg?style=flat-square)]()

*Inspired by [LeonardSSH/vscord](https://github.com/LeonardSSH/vscord) — brought directly to the CLI terminal.*

</div>

---

## ⚡ Highlights (จุดเด่น)

* 🧠 **Live Smart Context**: ตรวจจับภาษาโค้ดและชื่อไฟล์ที่ Agent กำลังเขียนหรือแก้ไขจริงแบบเรียลไทม์
  * แสดงผลเจาะจง: `Writing Python (main.py)`, `Writing TypeScript (index.ts)`, `Writing Luau (client.lua)`
  * สลับไอคอนภาษาโปรแกรมบน Discord Profile ตามไฟล์ที่ทำงานอยู่จริงอัตโนมัติ
* 🚀 **Zero-Lag Native Rust Shim**: สตาร์ทในระดับมิลลิวินาที ไม่กระทบประสิทธิภาพและคีย์ลัดของ CLI
* 🪟 **Universal Terminal Compatibility**: ใช้งานได้ทันทีใน **Windows Terminal (`wt`)**, **Command Prompt (`cmd`)**, **PowerShell (5.1 & 7)**, และ **Git Bash**
* 🔌 **Zero External NPM Packages**: เชื่อมต่อผ่าน Windows Named Pipe IPC (`\\.\pipe\discord-ipc-0..9`) ดั้งเดิม ไม่ต้องลง dependencies เพิ่ม
* 🛡️ **Auto-Reconnect & Clean Exit**: เชื่อมต่อใหม่อัตโนมัติหากเปิด Discord ทีหลัง และปิดโปรเซส RPC ทันทีเมื่อปิด `agy`

---

## 📸 Rich Presence Preview

```text
Playing Visual Studio Code
├── Details: Writing Python (server.py)
├── State:   agycord • main (2 modified)
├── Icon:    Python (Language: PYTHON)
└── Small:   Visual Studio Code
```

---

## 📁 Repository Structure (โครงสร้างโปรเจกต์)

```text
agycord/
├── bin/
│   ├── agy.exe           # Precompiled native Rust shim
│   ├── agy.cmd           # Windows Command Prompt wrapper
│   └── agy               # Shell script for Git Bash / WSL
├── src/
│   ├── discord-rpc.js    # Smart Discord RPC Engine (Node.js)
│   └── shim/             # Native Shim Source (Rust)
│       ├── Cargo.toml
│       └── src/main.rs
├── install.ps1           # 1-Click Automated Installer
├── uninstall.ps1         # 1-Click Uninstaller
├── package.json          # Node.js project metadata
├── README.md             # Documentation
└── LICENSE               # MIT License
```

---

## 📥 Installation (วิธีติดตั้ง)

### 1-Click Automated Install (แนะนำ)
เปิด PowerShell ในโฟลเดอร์โปรเจกต์แล้วรัน:
```powershell
.\install.ps1
```
*ระบบจะติดตั้งไฟล์ที่จำเป็นและตั้งค่า Environment PATH ให้อัตโนมัติ*

ปิดแล้วเปิดหน้าต่าง Terminal ใหม่ จากนั้นพิมพ์:
```bash
agy
```

---

## 🛠️ Development & Building (สำหรับผู้พัฒนา)

### ทดสอบการทำงานของ RPC Engine โดยตรง:
```bash
node src/discord-rpc.js
```

### คอมไพล์ Native Shim ใหม่ด้วย Rust:
```bash
rustc -O src/shim/src/main.rs -o bin/agy.exe
```
หรือใช้ Cargo:
```bash
cd src/shim
cargo build --release
```

---

## ⚙️ Configuration (การตั้งค่าเพิ่มเติม)

### เปลี่ยน Discord Application ID
ค่าเริ่มต้นจะใช้ Application ID ของ vscord (`782685898163617802`) หากต้องการใช้ App ID ของตนเอง:
1. ไปที่ [Discord Developer Portal](https://discord.com/developers/applications) เพื่อสร้าง Application
2. ตั้งค่าผ่าน Environment Variable:
   ```bash
   set DISCORD_CLIENT_ID=YOUR_APP_ID
   ```
   หรือแก้ไขตัวแปร `CLIENT_ID` ในไฟล์ `src/discord-rpc.js`

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).  
Maintained by [ZirconX](https://github.com/ZirconX).
