<div align="center">

# 💎 Zircord

**Universal, Intelligent Discord Rich Presence for Terminal, Shells, Neovim & Roblox Studio**

[![GitHub Repository](https://img.shields.io/badge/GitHub-ZXD44%2FZircord-blue?style=flat-square&logo=github)](https://github.com/ZXD44/Zircord)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey.svg?style=flat-square)]()
[![Runtime](https://img.shields.io/badge/Node.js-18%2B-brightgreen.svg?style=flat-square)]()
[![Shell Support](https://img.shields.io/badge/Shell-wt%20%7C%20cmd%20%7C%20pwsh%20%7C%20bash%20%7C%20zsh-purple.svg?style=flat-square)]()

*Crafted by [ZirconX](https://github.com/ZXD44) — Engineered natively for Terminal lovers, Roblox developers, and standalone users.*

</div>

---

## ⚡ Features (จุดเด่น)

* 💎 **Zircord Engine**: ตรวจจับภาษาโค้ดและชื่อไฟล์ที่กำลังเขียนจริงแบบเรียลไทม์ (รองรับทั้ง Terminal, AI Agents เช่น Antigravity, และ Editors ทั่วไป)
* 🚀 **Auto-Start on Boot (เปิดเครื่องแล้วทำงานทันที)**: ติดตั้งครั้งเดียว ระบบจะรันตัวเองเงียบๆ ในแบ็กกราวด์ทันทีที่เปิด Windows ไม่ต้องคอยเปิดเทอร์มินัลทิ้งไว้
* 🖱️ **Non-CLI Friendly (1-Click Installer)**: สำหรับผู้ใช้ทั่วไป แค่ดับเบิ้ลคลิก `install.cmd` ระบบจะตั้งค่าและเริ่มทำงานให้อัตโนมัติทันที
* 🎮 **Roblox Studio & Luau Integration**: ตรวจจับโปรเจกต์ Roblox อัตโนมัติ (Roblox Studio, Bloxstrap, Rojo `default.project.json`, Wally, Rokit)
  * แยกประเภทสคริปต์ Luau เจาะจง: `Client Script`, `Server Script`, `Module Script`
  * แสดงชื่อเกม/Place Name และสถานะ Rojo Sync บนการ์ด Discord ทันที
  * สลับ Client ID เป็น **Roblox Studio** อัตโนมัติเมื่อเปิด Studio
* 💻 **Terminal Editors Auto-Detection**: สแกนและตรวจจับ Editor ที่กำลังเปิดทำงานในคอนโซลอัตโนมัติ (`Neovim`, `Vim`, `Helix`, `Micro`, `Nano`)
* 📊 **Dedicated Git Statistics Line**: แยกบรรทัด Git ชัดเจน แสดงชื่อผู้ใช้ `👤 ZirconX`, Branch `🌿 master`, และ Git Diff Stats `[+45/-12]` แบบเรียลไทม์
* 🔘 **Interactive Profile Buttons**: ปุ่มกดบนการ์ด Discord เชื่อมโยงไปยัง GitHub Repository และโปรไฟล์ผู้พัฒนาโดยตรง
* ☕ **Intelligent AFK Detection**: สลับสถานะเป็นโหมดพักสายตา/จิบกาแฟอัตโนมัติหากไม่มีการเคลื่อนไหวเกินเวลาที่กำหนด
* ⚙️ **Config File (`zircord.json`)**: ปรับแต่งธีม, ชื่อผู้ใช้, Client ID, ปุ่มกด, และเวลา AFK ผ่าน JSON ยืดหยุ่น
* 🌐 **Universal Cross-Platform**: รองรับทั้ง Windows Named Pipe และ Linux/macOS Unix Domain Sockets

---

## 📋 Requirements (ความต้องการของระบบ)

1. **Discord Desktop App**: เปิดใช้งาน Discord บนเครื่อง (Discord, Discord Canary หรือ Discord PTB)
2. **Node.js**: เวอร์ชัน 18 ขึ้นไป ([ดาวน์โหลดฟรีที่ nodejs.org](https://nodejs.org))

---

## 📸 Rich Presence Preview

```text
PLAYING A GAME
Visual Studio Code

🔥 กำลังเขียน TypeScript: src/discord-rpc.ts
👤 ZirconX • 🌿 master • ✏️ แก้ไป 3 ไฟล์ [+85/-20]
02:45 elapsed

[ 📂 ดูโค้ดบน GitHub ]   [ 👤 ZirconX Profile ]
```

---

## 📥 Installation (วิธีติดตั้ง)

### 🖱️ วิธีที่ 1: แบบ 1-Click (สำหรับผู้ใช้ทั่วไป / ไม่ใช้ CLI)
1. ดาวน์โหลดหรือ Clone โฟลเดอร์โปรเจกต์มาไว้ในเครื่อง:
   ```bash
   git clone https://github.com/ZXD44/Zircord.git
   ```
2. **ดับเบิ้ลคลิกที่ไฟล์ `install.cmd`**
3. เสร็จสิ้น! ระบบจะ:
   * ตั้งค่าให้ **รันอัตโนมัติทุกครั้งที่เปิดเครื่อง (Windows Startup)**
   * เริ่มการทำงานในแบ็กกราวด์ทันที
   * เมื่อเปิด Discord ขึ้นมา สถานะจะปรากฏบนโปรไฟล์ทันที

---

### 💻 วิธีที่ 2: ติดตั้งผ่าน PowerShell (สำหรับ Developer)
เปิด PowerShell ในโฟลเดอร์โปรเจกต์แล้วรัน:
```powershell
.\install.ps1
```

---

## 🕹️ CLI Commands (คำสั่งจัดการ)

สำหรับผู้ใช้งานผ่าน Terminal / Shell สามารถสั่งการได้ตลอดเวลา:

```bash
zircord              # รัน Zircord มอนิเตอร์โฟลเดอร์ปัจจุบัน (Foreground)
zircord start        # สั่งรัน Zircord แบ็กกราวด์ (Background Daemon)
zircord status       # เช็คสถานะการทำงาน (PID, โฟลเดอร์, ธีม, ผู้ใช้)
zircord stop         # สั่งปิด Zircord ทุกตัวที่รันอยู่ทันที
zircord --help       # แสดงวิธีใช้งานทั้งหมด
```
*(คำสั่ง `clicord` ยังคงใช้งานได้เป็น Alias เพื่อความเข้ากันได้ย้อนหลัง)*

---

## ⚙️ Configuration (`zircord.json`)

สามารถปรับแต่งการทำงานได้ผ่านไฟล์ `~/.gemini/zircord.json` (ตั้งค่าทั้งเครื่อง) หรือ `zircord.json` ในโฟลเดอร์โปรเจกต์:

```json
{
  "$schema": "./config/zircord.schema.json",
  "theme": "thai",
  "username": "ZirconX",
  "afkTimeoutMinutes": 5,
  "showButtons": true,
  "profileUrl": "https://github.com/ZXD44",
  "showGitStats": true,
  "enableRobloxDetection": true,
  "clientId": ""
}
```

*ดูพรีเซ็ตตัวอย่างเพิ่มเติมได้ในโฟลเดอร์ [`config/presets/`](config/presets/)*

---

## 📁 Project Structure (โครงสร้างโปรเจกต์)

```text
Zircord/
├── .github/              # GitHub Actions CI & Issue Templates
├── bin/                  # Executables & CLI Launchers
├── config/               # JSON Schema & Presets (thai, cyber, modern, roblox-dev)
├── docs/                 # Architecture, Changelog & Contributing Guide
├── scripts/              # Install & Uninstall automation scripts
├── src/                  # Core Discord RPC Daemon & Rust Shim Source
├── install.cmd           # 1-Click Installer for Windows
├── uninstall.cmd         # 1-Click Uninstaller
├── zircord.json          # Main user configuration
└── README.md
```

---

## 📚 Documentation (เอกสารเพิ่มเติม)

* 🏛️ [Architecture Guide](docs/ARCHITECTURE.md) — สถาปัตยกรรมและการทำงานภายในระบบ
* 📜 [Changelog](docs/CHANGELOG.md) — ประวัติการอัปเดตเวอร์ชัน
* 🤝 [Contributing Guide](docs/CONTRIBUTING.md) — วิธีร่วมพัฒนาและเพิ่มธีมใหม่

### ตัวเลือกการตั้งค่า:
| Key | Type | Default | รายละเอียด |
| :--- | :---: | :---: | :--- |
| `theme` | `string` | `"thai"` | ธีมการแสดงผล (`"thai"`, `"modern"`, `"cyber"`, `"cozy"`) |
| `username` | `string` | `"ZirconX"` | ชื่อผู้พัฒนาที่จะแสดงบน Discord |
| `afkTimeoutMinutes`| `number` | `5` | เวลาที่ไม่มีการเคลื่อนไหวเพื่อเข้าสู่โหมด AFK (นาที) |
| `showButtons` | `boolean` | `true` | เปิด/ปิด ปุ่มกด GitHub Repository และโปรไฟล์ |
| `profileUrl` | `string` | `""` | ลิงก์ URL โปรไฟล์ส่วนตัว (เช่น GitHub หรือ Portfolio) |
| `showGitStats` | `boolean` | `true` | เปิด/ปิด แสดงผล `[+ins/-del]` แบบเรียลไทม์ |
| `enableRobloxDetection` | `boolean` | `true` | เปิด/ปิด การสแกนกระบวนการ Roblox Studio และ Rojo |
| `clientId` | `string` | `""` | Custom Discord Application ID (เว้นว่างเพื่อใช้ VS Code อัตโนมัติ) |

---

## 💡 How to Customize Header Name (`Playing ...`)

หากต้องการเปลี่ยนหัวข้อบนสุดจาก `Visual Studio Code` เป็นชื่อโปรเจกต์หรือชื่อที่ต้องการ:
1. เข้าไปที่ [Discord Developer Portal](https://discord.com/developers/applications)
2. กด **New Application** และตั้งชื่อตามใจชอบ (เช่น `Zircord`, `Antigravity CLI`, `The Matrix`)
3. คัดลอก **Application ID**
4. นำมาวางในช่อง `"clientId"` ในไฟล์ `zircord.json`

---

## 🗑️ Uninstallation (วิธีถอนการติดตั้ง)

ดับเบิ้ลคลิกที่ไฟล์ **`uninstall.cmd`** หรือรันผ่าน PowerShell:
```powershell
.\uninstall.ps1
```
ระบบจะปิดการทำงาน ลบ Auto-Start จาก Windows Startup และลบไฟล์ติดตั้งทั้งหมดออกอย่างสมบูรณ์

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).  
Developed & Maintained by [ZirconX](https://github.com/ZXD44).
