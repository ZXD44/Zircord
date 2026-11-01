<div align="center">

# 💎 Zircord

**Discord Rich Presence สำหรับคนเขียนโค้ดและพัฒนาเกม**  
ทำงานเงียบๆ ในแบ็กกราวด์อัตโนมัติ ไม่ต้องคอยเปิดหน้าต่างทิ้งไว้

[![GitHub](https://img.shields.io/badge/GitHub-ZXD44%2FZircord-blue?style=flat-square&logo=github)](https://github.com/ZXD44/Zircord)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Windows-lightgrey.svg?style=flat-square)]()
[![Node](https://img.shields.io/badge/Node.js-18%2B-brightgreen.svg?style=flat-square)]()

</div>

---

### 📸 หน้าตาบน Discord

```text
PLAYING A GAME
Visual Studio Code

🔥 เขียนโค้ด: src/discord-rpc.js
📁 Zircord (master) • ✏️ +27 -6
02:45 elapsed

[ ดูโค้ดบน GitHub ]   [ โปรไฟล์ ZirconX ]
```

> 📱 **ออกแบบรองรับมือถือ 100%:** สั้นกระชับ พอดีการ์ด ไม่โดนตัดคำไข่ปลา (`...`) และปุ่มกดภาษาไทยไร้อีโมจิแสดงผลสวยงามเมื่อคนอื่นส่องโปรไฟล์

---

### ⚡ จุดเด่น
* 🚀 **เปิดคอมแล้วรันเองทันที:** รันเงียบๆ ในแบ็กกราวด์ ไม่ขึ้นหน้าต่างดำกวนใจ
* 🎮 **รองรับ Roblox Studio & Luau:** ตรวจจับชื่อ Place, Rojo Sync, และแยกระหว่าง Client/Server/Module Script ให้อัตโนมัติ
* 💻 **ตรวจจับ Terminal Editors:** ถ้าเปิด Neovim, Vim, Helix, หรือ Nano ในคอนโซล ระบบจะโชว์บน Discord ทันที
* 📊 **บอกสถานะ Git:** โชว์ Branch ปัจจุบัน และจำนวนบรรทัดที่แก้ `[+27/-6]` แบบเรียลไทม์
* ☕ **มีโหมด AFK:** นั่งพักสายตาเกิน 5 นาที สถานะจะเปลี่ยนเป็นจิบกาแฟพักเบรกให้อัตโนมัติ

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

### 🕹️ คำสั่งบน Terminal (ถ้าต้องการใช้)

```bash
zircord status       # ดูสถานะการทำงาน (PID, โฟลเดอร์ที่เปิด, ธีม)
zircord stop         # สั่งปิด Zircord ทั้งหมด
zircord start        # สั่งเปิด Zircord แบ็กกราวด์ใหม่
zircord              # รันมอนิเตอร์โฟลเดอร์ปัจจุบัน
```

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

**Q: ถ้าอยากลบการติดตั้ง ทำยังไง?**  
**A:** ดับเบิ้ลคลิกที่ไฟล์ `uninstall.cmd` ได้เลย ระบบจะลบทุกอย่างรวมถึงตัวรันตอนเปิดเครื่องให้สะอาดหมดจด

---

### 📄 License

MIT License — สร้างและพัฒนาโดย [ZirconX (ZXD44)](https://github.com/ZXD44).
