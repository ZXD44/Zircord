<div align="center">

# 💎 Zircord

**Universal, Intelligent Discord Rich Presence for Terminal, Shells, Neovim & Roblox Studio**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey.svg?style=flat-square)]()
[![Runtime](https://img.shields.io/badge/Node.js-18%2B-green.svg?style=flat-square)]()
[![Built with Rust](https://img.shields.io/badge/Built%20With-Rust-orange.svg?style=flat-square)]()
[![Shell Support](https://img.shields.io/badge/Shell-wt%20%7C%20cmd%20%7C%20pwsh%20%7C%20bash%20%7C%20zsh-purple.svg?style=flat-square)]()

*Crafted by [ZirconX](https://github.com/ZirconX) — Engineered natively for the Terminal, all Shells, and AI Pair Programmers.*

</div>

---

## ⚡ Features (จุดเด่น)

* 💎 **Zircord Engine**: ตรวจจับภาษาโค้ดและชื่อไฟล์ที่กำลังเขียนจริงแบบเรียลไทม์ (รองรับทั้งการเขียนผ่าน Terminal, AI Agents เช่น Antigravity, และ Editors ทั่วไป)
* 🎮 **Roblox Studio & Luau Integration**: ตรวจจับโปรเจกต์ Roblox อัตโนมัติ (Roblox Studio, Bloxstrap, Rojo `default.project.json`, Wally, Rokit)
  * แยกประเภทสคริปต์ Luau เจาะจง: `Client Script`, `Server Script`, `Module Script`
  * แสดงชื่อเกม/Place Name และสถานะ Rojo Sync บนการ์ด Discord ทันที
  * สลับ Client ID เป็น **Roblox Studio** อัตโนมัติเมื่อเปิด Studio
* 💻 **Terminal Editors Auto-Detection**: สแกนและตรวจจับ Editor ที่กำลังเปิดทำงานในคอนโซลอัตโนมัติ (`Neovim`, `Vim`, `Helix`, `Micro`, `Nano`)
* 📊 **Dedicated Git Statistics Line**: แยกบรรทัด Git ชัดเจน แสดงชื่อผู้ใช้ `👤 ZirconX`, Branch `🌿 master`, และ Git Diff Stats `[+45/-12]` แบบเรียลไทม์
* 🔘 **Interactive Profile Buttons**: ปุ่มกดบนการ์ด Discord เชื่อมโยงไปยัง GitHub Repository และโปรไฟล์ผู้พัฒนาโดยตรง
* ☕ **Intelligent AFK Detection**: สลับสถานะเป็นโหมดพักสายตา/จิบกาแฟอัตโนมัติหากไม่มีการเคลื่อนไหวเกินเวลาที่กำหนด
* ⚙️ **Config File (`zircord.json`)**: ปรับแต่งธีม, ชื่อผู้ใช้, Client ID, ปุ่มกด, และเวลา AFK ผ่าน JSON ยืดหยุ่น
* 🌐 **Universal Terminal Compatibility**: 
  * รันคำสั่ง **`zircord`** เพื่อมอนิเตอร์โฟลเดอร์โปรเจกต์ใดๆ ใน Terminal ได้ทันที
  * รองรับ Cross-Platform ทั้ง Windows Named Pipe และ Linux/macOS Unix Domain Sockets

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

## 🕹️ CLI Commands (คำสั่งจัดการ)

สามารถสั่งการ Zircord ได้ง่ายๆ ผ่านเทอร์มินัลทุกตัว:

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
  "$schema": "./zircord.schema.json",
  "theme": "thai",
  "username": "ZirconX",
  "afkTimeoutMinutes": 5,
  "showButtons": true,
  "profileUrl": "https://github.com/ZirconX",
  "showGitStats": true,
  "enableRobloxDetection": true,
  "clientId": ""
}
```

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

## 📥 Installation (วิธีติดตั้ง)

เปิด PowerShell ในโฟลเดอร์โปรเจกต์แล้วรัน:
```powershell
.\install.ps1
```

ปิดแล้วเปิดหน้าต่าง Terminal ใหม่ สามารถใช้งานได้ทันที:
1. **รันมอนิเตอร์โปรเจกต์ทั่วไป (Universal CLI)**: 
   ```bash
   zircord
   ```
2. **รันอัตโนมัติพร้อม Antigravity CLI**: 
   ```bash
   agy
   ```

### วิธีถอนการติดตั้ง:
```powershell
.\uninstall.ps1
```

---

## 💡 How to Customize Header Name (`Playing ...`)

หากต้องการเปลี่ยนหัวข้อบนสุดจาก `Visual Studio Code` เป็นชื่อโปรเจกต์หรือชื่อที่ต้องการ:
1. เข้าไปที่ [Discord Developer Portal](https://discord.com/developers/applications)
2. กด **New Application** และตั้งชื่อตามใจชอบ (เช่น `Zircord`, `Antigravity CLI`, `The Matrix`)
3. คัดลอก **Application ID**
4. นำมาวางในช่อง `"clientId"` ในไฟล์ `zircord.json`

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).  
Developed & Maintained by [ZirconX](https://github.com/ZirconX).
