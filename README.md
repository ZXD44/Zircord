<div align="center">

# 🌌 Clicord

**Universal, Intelligent Discord Rich Presence for Terminal & Any CLI**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows-lightgrey.svg?style=flat-square)]()
[![Runtime](https://img.shields.io/badge/Node.js-18%2B-green.svg?style=flat-square)]()
[![Built with Rust](https://img.shields.io/badge/Built%20With-Rust-orange.svg?style=flat-square)]()
[![Shell Support](https://img.shields.io/badge/Shell-wt%20%7C%20cmd%20%7C%20pwsh%20%7C%20bash-purple.svg?style=flat-square)]()

*Inspired by [LeonardSSH/vscord](https://github.com/LeonardSSH/vscord) — brought natively to the Terminal, all Shells, and AI CLI agents.*

</div>

---

## ⚡ Features (จุดเด่น)

* 🧠 **Live Smart Context**: ตรวจจับภาษาโค้ดและชื่อไฟล์ที่กำลังเขียนจริงแบบเรียลไทม์ (รองรับทั้งการเขียนเองใน Vim/Nano/VSCode หรือผ่าน AI Agents)
* 🎮 **Roblox Studio & Luau Integration**: ตรวจจับโปรเจกต์ Roblox อัตโนมัติ (Roblox Studio, Rojo `default.project.json`, Wally, Rokit)
  * แยกประเภทสคริปต์ Luau เจาะจง: `Client Script`, `Server Script`, `Module Script`
  * แสดงชื่อเกม/Place Name และสถานะ Rojo Sync บนการ์ด Discord ทันที
* 🔘 **Interactive Buttons**: ปุ่มกดบนการ์ด Discord เชื่อมโยงไปยัง GitHub Repository และโปรไฟล์ผู้พัฒนาโดยตรง
* 📊 **Git Diff Statistics**: แสดงจำนวนไฟล์และบรรทัดที่แก้ไขจริง `[+45/-12]` แบบเรียลไทม์
* ☕ **Intelligent AFK Detection**: สลับสถานะเป็นโหมดพักสายตา/จิบกาแฟอัตโนมัติหากไม่มีการเคลื่อนไหวเกินเวลาที่กำหนด
* ⚙️ **Config File (`clicord.json`)**: ปรับแต่งธีม, ชื่อผู้ใช้, ปุ่มกด และเวลา AFK ผ่าน JSON โดยไม่ต้องแตะต้องโค้ด
* 🌐 **Universal Terminal Compatibility**: 
  * รันคำสั่ง **`clicord`** เพื่อมอนิเตอร์โฟลเดอร์โปรเจกต์ใดๆ ใน Terminal ได้อิสระ
  * หรือรันอัตโนมัติคู่กับ AI Pair Programmers เช่น `agy` ผ่าน Native Rust Shim

---

## 📸 Rich Presence Preview

```text
Playing Visual Studio Code
├── ⚡ กำลังเขียน Python: server.py
├── 👤 ZirconX @ clicord (🌿 main • ✏️ แก้ไป 3 ไฟล์ [+85/-20])
├── 02:45 elapsed
└── [ 📂 ดูโค้ดบน GitHub ]   [ 👤 ZirconX Profile ]
```

---

## ⚙️ Configuration (`clicord.json`)

สามารถตั้งค่าได้ง่ายๆ ผ่านไฟล์ `~/.gemini/clicord.json` หรือ `clicord.json` ในโฟลเดอร์โปรเจกต์:

```json
{
  "theme": "thai",
  "username": "ZirconX",
  "afkTimeoutMinutes": 5,
  "showButtons": true,
  "profileUrl": "https://github.com/ZirconX",
  "showGitStats": true
}
```

### ธีมที่รองรับ (`theme`):
* `"thai"` — ภาษาไทยผสมสัญลักษณ์ Dev (ค่าเริ่มต้น)
* `"modern"` — สไตล์โมเดิร์นคลีน ภาษาอังกฤษ
* `"cyber"` — สไตล์ Sci-Fi Hacker / Matrix
* `"cozy"` — สไตล์ชิลล์ๆ จิบกาแฟ

---

## 📥 Installation (วิธีติดตั้ง)

เปิด PowerShell ในโฟลเดอร์โปรเจกต์แล้วรัน:
```powershell
.\install.ps1
```

ปิดแล้วเปิดหน้าต่าง Terminal ใหม่ สามารถใช้งานได้ 2 รูปแบบ:
1. **รันมอนิเตอร์โปรเจกต์ใดก็ได้ (Universal Mode)**: พิมพ์ `clicord`
2. **รันอัตโนมัติพร้อม Antigravity CLI**: พิมพ์ `agy`

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).  
Maintained by [ZirconX](https://github.com/ZirconX).
