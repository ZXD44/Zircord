# 🚀 เวิร์กโฟลว์และแนวทางการพัฒนา (Workflows & Maintenance)

คู่มือการทดสอบ, รันคำสั่ง, ติดตั้ง และเพิ่มความสามารถใหม่ให้กับระบบ Zircord

---

## 1. คำสั่งควบคุม Daemon (CLI Commands)

Agent หรือผู้ใช้สามารถสั่งการ Zircord ผ่านคำสั่งต่อไปนี้:

```bash
# ตรวจสอบสถานะการทำงานและเครื่องมือที่ตรวจจับได้
node src/discord-rpc.js status

# เริ่มการทำงานของ Daemon ในแบ็กกราวด์ (ซ่อนหน้าต่าง)
node src/discord-rpc.js start [path]

# หยุดการทำงานของ Daemon ทั้งหมด
node src/discord-rpc.js stop

# รันคำสั่งหรือเครื่องมือใดๆ โดยเปิด Zircord มอนิเตอร์ควบคู่
node src/discord-rpc.js run <command> [args...]
# หรือทางลัด:
node src/discord-rpc.js freebuff
node src/discord-rpc.js nvim
```

---

## 2. ขั้นตอนการติดตั้งและกระจายไฟล์ (Deployment)

เมื่อมีการปรับปรุงสคริปต์หลักหรือ Shims:
1. ไฟล์สคริปต์หลักอยู่ที่ `src/discord-rpc.js`
2. อัปเดตไปยังระบบ Global ของผู้ใช้งาน:
   ```powershell
   Copy-Item "src\discord-rpc.js" "$env:USERPROFILE\.gemini\scripts\discord-rpc.js" -Force
   ```
3. หากมีการเพิ่ม Wrapper ใหม่ใน `bin/`:
   * ตรวจสอบว่ามีทั้งไฟล์ `.cmd` สำหรับ Windows CMD/PowerShell และไฟล์เชลล์สคริปต์สำหรับ Git Bash/WSL
   * อัปเดตรายการไฟล์ใน `scripts/install.ps1` อาร์เรย์ `$wrappers`
   * คัดลอกไปยัง `$env:USERPROFILE\.gemini\bin`

---

## 3. แนวทางการเพิ่ม Agent หรือเครื่องมือใหม่ (Adding New Tool)

หากต้องการเพิ่มการตรวจจับ AI Agent หรือ CLI ตัวใหม่:
1. **ประกาศฟังก์ชันตรวจจับ** ใน `src/discord-rpc.js` เช่น:
   ```javascript
   function getMyToolActivity(targetDir) {
       if (config.enableMyToolDetection === false) return null;
       const p = cachedProcessNames;
       if (p.has("mytool.exe") || p.has("mytool")) {
           return { name: "MyTool", folder: path.basename(targetDir) };
       }
       return null;
   }
   ```
2. **เพิ่มฟังก์ชันลงใน `updatePresence()`**:
   * เรียกตัวแปรในส่วนหัว
   * เพิ่มบล็อก `else if` ในลำดับความสำคัญที่เหมาะสม
3. **เพิ่มฟิลด์ลงใน Schema และ Default Config**:
   * เพิ่มใน `loadConfig()`: `enableMyToolDetection: true`
   * เพิ่มใน `config/zircord.schema.json`
4. **เพิ่มการแสดงผลใน `status`**:
   * แสดงในบล็อก `handleCliCommands()` ภายใต้คำสั่ง `status`

---

## 4. การทดสอบความถูกต้อง (Testing & Verification Checklist)

ก่อนส่งมอบงานทุกครั้ง ให้ตรวจสอบ Checklist ต่อไปนี้:
- [ ] รัน `node src/discord-rpc.js status` ไม่โยนข้อผิดพลาด (Exit Code 0)
- [ ] ตรวจจับโปรเจกต์และ Git Branch ปัจจุบันถูกต้อง
- [ ] แสดงสถิติ Per-file Diff (`+X -Y`) เมื่อมีการแก้ไขไฟล์
- [ ] แสดงป้าย `✨ ไฟล์ใหม่` เมื่อมีไฟล์ประเภท Untracked
- [ ] แสดงข้อความ `ซิงก์เรียบร้อย ✔️` เมื่อ Working tree สะอาด
- [ ] ไฟล์ `%USERPROFILE%\.gemini\scripts\discord-rpc.js` ได้รับการซิงก์ล่าสุด
