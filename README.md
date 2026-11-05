<div align="center">

# 💎 Zircord

**Discord Rich Presence สำหรับคนเขียนโค้ด, ทุก CLI, AI Agents และพัฒนาเกม**  
ทำงานเงียบๆ ในแบ็กกราวด์อัตโนมัติ ไม่ต้องคอยเปิดหน้าต่างทิ้งไว้

[![GitHub](https://img.shields.io/badge/GitHub-ZXD44%2FZircord-blue?style=flat-square&logo=github)](https://github.com/ZXD44/Zircord)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows-lightgrey.svg?style=flat-square)]()
[![Node](https://img.shields.io/badge/Node.js-18%2B-brightgreen.svg?style=flat-square)]()

</div>

---

### 📸 หน้าตาบน Discord (vscord Edition)

```text
PLAYING A GAME
Visual Studio Code

Editing discord-rpc.js
Workspace: Zircord (master [+14 -2])
02:45 elapsed

[ View Repository ]   [ View Profile ]
```

> 🌟 **vscord Standard:** จำลองความเท่และมินิมอลระดับพรีเมียมจาก [LeonardSSH/vscord](https://open-vsx.org/extension/LeonardSSH/vscord) แบบ 1:1 พร้อมไอคอนภาษาและปุ่ม GitHub / Profile อัตโนมัติ (และมีโหมด `thai`, `cyber`, `cozy` ให้เลือกปรับแต่งได้อิสระ)

---

### ⚡ จุดเด่น
* 🚀 **เปิดคอมแล้วรันเองทันที:** รันเงียบๆ ในแบ็กกราวด์ ไม่ขึ้นหน้าต่างดำกวนใจ ไร้ process churn 100%
* 🎨 **vscord 1:1 Aesthetic:** รองรับธีม `vscord` (มินิมอลสไตล์ VS Code แท้), `thai`, `cyber` และ `cozy`
* 🤖 **รองรับ CLI ทุกตัว & AI Coding Agents:**
  * **Antigravity (AGY):** แสดงผลสดๆ แบบเรียลไทม์เมื่อ Agent กำลังเขียน/แก้โค้ด
  * **Freebuff AI:** ตรวจจับโปรเจกต์, คำสั่ง และงานที่ทำอยู่
  * **Kiro AI, Claude Code, Cursor Agent, Aider, Gemini CLI, Windsurf, OpenCode, Codex, Copilot**
* 💻 **ตรวจจับ Terminal Editors:** Neovim, Vim, Helix, Micro, หรือ Nano ในคอนโซล
* ⚙️ **ตรวจจับ Dev CLIs & Shells:** Cargo, Bun, Deno, Docker, Git, Go, Python, PowerShell, Windows Terminal
* 🎮 **รองรับ Roblox Studio & Luau:** ตรวจจับชื่อ Place, Rojo Sync, และแยกระหว่าง Client/Server/Module Script ให้อัตโนมัติ
* 📊 **สถิติ Git แบบเรียลไทม์:** โชว์ชื่อ Workspace, Branch และความต่างของโค้ด `[+14 -2]` หรือ `✏️ +14 -2`
* ☕ **ระบบ Smart AFK / Idle Detection:** เมื่อหยุดเขียนโค้ดเกิน 5 นาที สถานะจะเปลี่ยนเป็น Idling / พักสายตา อัตโนมัติ
* 🛡️ **Zero-Bloat & Zero-Bugs:** ลดการใช้โค้ดลงกว่า 60% สั่งงานแบบ non-blocking, ตัดคำ UTF-8 ป้องกัน Discord packet drop, และป้องกัน Daemon รันซ้ำซ้อน 100%

---

### 📥 วิธีติดตั้ง (ง่ายที่สุดใน 10 วินาที)

#### สิ่งที่ต้องมีในเครื่อง:
1. แอป **Discord** (เปิดใช้งานปกติ)
2. **[Node.js](https://nodejs.org)** (ดาวน์โหลดตัว LTS ฟรี)

#### ขั้นตอนติดตั้ง:
1. ดาวน์โหลดหรือ Clone โปรเจกต์ลงเครื่อง:
   ```bash
   git clone https://github.com/ZXD44/Zircord.git
   ```
2. **ดับเบิ้ลคลิกไฟล์ `install.cmd`**
3. **เสร็จแล้ว!** ระบบจะเริ่มทำงานทันที และเปิดคอมใหม่ครั้งหน้าก็ทำงานเองอัตโนมัติ

---

### 🕹️ คำสั่งบน Terminal

```bash
zircord status            # ดูสถานะการทำงาน (PID, โฟลเดอร์, Active CLIs เช่น Freebuff)
zircord stop              # สั่งปิด Zircord ทั้งหมด
zircord start [path]      # สั่งเปิด Zircord แบ็กกราวด์ใหม่
zircord run <cli> [args]  # รันคำสั่ง CLI ใดๆ พร้อมต่อ Zircord ให้อัตโนมัติ
zircord freebuff          # ทางลัดรัน Freebuff ผ่าน Zircord ทันที
zircord nvim              # ทางลัดรัน Neovim ผ่าน Zircord ทันที
```

> 💡 **หมายเหตุ:** ตัวติดตั้งได้เตรียม Wrapper สำหรับคำสั่งยอดนิยม (`freebuff`, `claude`, `cursor`, `cursor-agent`, `kiro`, `gemini`, `windsurf`, `aider`, `agy`) ไว้ใน PATH ให้เรียบร้อยแล้ว สามารถพิมพ์คำสั่งเดิมใน Terminal ได้ตามปกติ ระบบจะต่อสถานะเข้า Discord อัตโนมัติ

---

### ⚙️ ปรับแต่ง (`zircord.json`)

แก้ไขค่าได้ในไฟล์ `zircord.json`:

```json
{
  "theme": "thai",
  "username": "ZirconX",
  "afkTimeoutMinutes": 5,
  "showButtons": true,
  "profileUrl": "https://github.com/ZXD44",
  "showGitStats": true,
  "enableRobloxDetection": true,
  "enableFreebuffDetection": true,
  "enableKiroDetection": true,
  "enableAgentDetection": true,
  "enableCliDetection": true,
  "clientId": ""
}
```

* **เปลี่ยนหัวข้อบนสุด:** ใส่ `clientId` ของ Discord Application ตัวเองลงไปได้เลย
* **ธีมที่เลือกได้:** `"thai"` (ค่าเริ่มต้น), `"modern"`, `"cyber"`, `"cozy"`
* **กำหนดปุ่มเองได้ (ไม่เกิน 2 ปุ่ม):** ใส่ฟิลด์ `"buttons": [{"label": "ชื่อปุ่ม", "url": "https://..."}]` ใน `zircord.json`

---

### ❓ คำถามที่พบบ่อย (FAQ)

**Q: ถ้าปิดคอมแล้วเปิดใหม่ มันยังทำงานอยู่ไหม?**  
**A:** **ทำงานอัตโนมัติ 100%!** ตัวติดตั้งได้เพิ่ม Zircord เข้าไปใน Windows Startup เรียบร้อยแล้ว เมื่อเปิดคอมใหม่ Zircord จะรันเงียบๆ รอไว้ทันที และจะขึ้นโชว์บน Discord ทันทีที่คุณเปิดแอป Discord

**Q: Freebuff ทำงานยังไง? ต้องตั้งค่าอะไรเพิ่มไหม?**  
**A:** **ไม่ต้องตั้งค่าอะไรเลย!** ไม่ว่าจะพิมพ์ `freebuff` ใน Terminal หรือรันผ่านคำสั่งใดๆ Zircord จะตรวจจับ Process `freebuff.exe` พร้อมอ่านโปรเจกต์ที่กำลังทำและคำสั่ง Prompt มาขึ้นโชว์บน Discord ให้อัตโนมัติแบบเรียลไทม์

**Q: ถ้าอยากลบการติดตั้ง ทำยังไง?**  
**A:** ดับเบิ้ลคลิกที่ไฟล์ `uninstall.cmd` ได้เลย ระบบจะลบทุกอย่างรวมถึงตัวรันตอนเปิดเครื่องให้สะอาดหมดจด
