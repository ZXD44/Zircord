# AGY Discord Rich Presence (RPC) 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows-lightgrey.svg)]()
[![Runtime](https://img.shields.io/badge/Node.js-18%2B-green.svg)]()
[![Rust](https://img.shields.io/badge/Built%20With-Rust-orange.svg)]()

> Intelligent, real-time **Discord Rich Presence** for **Google Antigravity CLI (`agy`)**.
> Works seamlessly across **Windows Terminal (`wt`)**, **Command Prompt (`cmd`)**, **PowerShell**, and **Git Bash**.

---

## ✨ Features (จุดเด่น)

* 🧠 **Smart Context Detection**: ตรวจจับภาษาโค้ดและไฟล์ที่กำลังเขียนหรือแก้ไขแบบเรียลไทม์
  * แสดง `Writing Python (main.py)`, `Writing TypeScript (index.ts)`, `Writing Luau (client.lua)` ฯลฯ
  * เปลี่ยนไอคอนภาษาโปรแกรมบน Discord ตามไฟล์ที่กำลังเขียนจริงอัตโนมัติ
* ⚡ **Zero-Lag Native Shim**: คอมไพล์ด้วย Rust รันในระดับมิลลิวินาที ไม่กระทบความเร็วของ CLI
* 🪟 **Universal Shell Support**: รองรับทั้ง `cmd.exe`, `wt.exe`, PowerShell 5.1/7 และ Git Bash
* 🔌 **Zero External NPM Dependencies**: เชื่อมต่อผ่าน Discord IPC Named Pipe (`\\.\pipe\discord-ipc-0..9`) ดั้งเดิมของ Windows โดยตรง
* 🔄 **Auto Reconnect & Graceful Cleanup**: เชื่อมต่อใหม่อัตโนมัติหากเปิด Discord ทีหลัง และปิดโปรเซส RPC ทันทีเมื่อออกจาก `agy`

---

## 📸 Rich Presence Preview

```text
Playing Visual Studio Code
├── Details: Writing Python (server.py)
├── State:   AGY-CLI • main (3 modified)
├── Icon:    Python (Language: PYTHON)
└── Small:   Visual Studio Code
```

---

## 🛠️ Project Structure (โครงสร้างโปรเจกต์)

```text
AGY-CLI/
├── bin/
│   ├── agy.exe           # Precompiled native Rust shim
│   ├── agy.cmd           # Windows Command Prompt wrapper
│   └── agy               # Shell script for Git Bash / WSL
├── src/
│   ├── discord-rpc.js    # Smart Discord RPC Engine (Node.js)
│   └── shim/             # Native Shim Source (Rust)
│       ├── Cargo.toml
│       └── src/main.rs
├── install.ps1           # 1-Click Installer
├── uninstall.ps1         # 1-Click Uninstaller
├── package.json          # Node project metadata
├── README.md             # Documentation
└── LICENSE               # MIT License
```

---

## 🚀 Installation (วิธีติดตั้ง)

### วิธีที่ 1: ติดตั้งอัตโนมัติผ่าน PowerShell (Automated)
เปิด PowerShell ในโฟลเดอร์นี้ แล้วรัน:
```powershell
.\install.ps1
```
* สคริปต์จะทำการย้าย binary และ engine ไปยัง `~/.gemini/` และเพิ่มลงใน User PATH อัตโนมัติ
* ปิดและเปิด Terminal ใหม่ จากนั้นพิมพ์ `agy` ใช้งานได้ทันที

### วิธีที่ 2: ติดตั้งหรือทดสอบแบบ Manual
1. รันสคริปต์ RPC ทดสอบโดยตรง:
   ```bash
   node src/discord-rpc.js
   ```
2. คอมไพล์ Native Shim ใหม่ (หากต้องการแก้ไขซอร์สโค้ด Rust):
   ```bash
   cd src/shim
   cargo build --release
   # ไฟล์ไบนารีจะอยู่ที่ target/release/agy-shim.exe
   ```

---

## ⚙️ Configuration (การตั้งค่าเพิ่มเติม)

### เปลี่ยน Application ID หรือไอคอนของตนเอง
หากต้องการเปลี่ยนชื่อ App หรือไอคอนใน Discord Developer Portal:
1. ไปที่ [Discord Developer Portal](https://discord.com/developers/applications) -> สร้าง App ใหม่
2. กำหนด Environment Variable หรือแก้ไขใน `src/discord-rpc.js`:
   ```javascript
   const CLIENT_ID = process.env.DISCORD_CLIENT_ID || "YOUR_APP_ID";
   ```

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
Created by [ZirconX](https://github.com/ZirconX).
