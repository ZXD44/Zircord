# ⚙️ สถาปัตยกรรมระบบและการตรวจจับ (Systems Architecture)

เอกสารเจาะลึกระบบภายในของ Zircord สำหรับ Agent เพื่อใช้ประกอบการแก้ไข ดีบัก หรือเพิ่มฟีเจอร์ใหม่

---

## 1. แกนหลัก Discord IPC Engine (`net` Socket)

Zircord สื่อสารกับ Discord Client โดยตรงผ่าน Local IPC Pipe:
* **Windows**: `\\.\pipe\discord-ipc-0` ถึง `\\.\pipe\discord-ipc-9`
* **Linux / macOS**: `/tmp/discord-ipc-0` หรือ `$XDG_RUNTIME_DIR/discord-ipc-0`

### โปรโตคอลของ Discord RPC:
1. **Opcode 0 (HANDSHAKE)**: ส่ง `client_id` และเวอรชัน `v: 1` ไปยังไปป์
   ```json
   { "v": 1, "client_id": "383226320970055681" }
   ```
2. **Opcode 1 (FRAME)**: ส่งข้อมูล Presence ผ่านคำสั่ง `SET_ACTIVITY`
   * `details`: ข้อความบรรทัดที่ 1 (ความยาวสูงสุด 128 ตัวอักษร)
   * `state`: ข้อความบรรทัดที่ 2 (ความยาวสูงสุด 128 ตัวอักษร)
   * `timestamps`: เวลาเริ่มต้น `{ start: timestamp }` สำหรับเวลานับเดินหน้า
   * `assets`: ไอคอนรูปใหญ่และเล็ก (`large_image`, `large_text`, `small_image`, `small_text`)
   * `buttons`: ป้ายลิงก์กดได้ (สูงสุด 2 ปุ่ม, `label` สูงสุด 32 ตัวอักษร, `url` สูงสุด 512 ตัวอักษร)
   > **ข้อจำกัดของ Discord:** Discord ไม่อนุญาตให้กำหนดสีพื้นหลังของปุ่มใน Rich Presence ผ่าน IPC (สีถูกกำหนดโดย Discord Client UI)

---

## 2. ระบบการโหลดคอนฟิก (Configuration Precedence)

ระบบค้นหาคอนฟิกตามลำดับความสำคัญ (Cascade):
1. `zircord.json` (ในไดเรกทอรีปัจจุบันที่กำลังมอนิเตอร์)
2. `clicord.json` (ในไดเรกทอรีปัจจุบัน - ความเข้ากันได้ย้อนหลัง)
3. `~/.gemini/zircord.json` (คอนฟิกโกลบอล)
4. `~/.gemini/clicord.json` (คอนฟิกโกลบอลสำรอง)
5. ค่าปริยายในโค้ด (Default fallback)

### ฟิลด์สำคัญในคอนฟิก:
```json
{
  "theme": "thai",                // ธีม: "thai", "modern", "cyber", "cozy"
  "username": "ZirconX",           // ชื่อผู้ใช้สำหรับแสดงผล
  "afkTimeoutMinutes": 5,          // เวลาตัดเข้าสู่โหมด AFK (นาที)
  "showButtons": true,             // เปิด/ปิดปุ่มบน Discord
  "profileUrl": "https://...",     // ลิงก์โปรไฟล์ของผู้ใช้
  "showGitStats": true,            // แสดงสถิติ Diff ของ Git (+X -Y)
  "enableRobloxDetection": true,   // ตรวจจับ Roblox Studio & Rojo
  "enableFreebuffDetection": true, // ตรวจจับ Freebuff AI
  "enableKiroDetection": true,     // ตรวจจับ Kiro AI CLI
  "enableAgentDetection": true,    // ตรวจจับ AI Coding Agents อื่นๆ
  "enableCliDetection": true,      // ตรวจจับ Terminal Shells & Dev Tools
  "buttons": []                    // กำหนดปุ่มเองได้สูงสุด 2 ปุ่ม
}
```

---

## 3. เครื่องยนต์ตรวจจับกิจกรรม (Activity Detectors)

ระบบจะประเมินหา Action ที่มีความสำคัญสูงสุดตามลำดับ:

```text
[ AFK Timeout Check ]
       │ (ถ้าไม่มีความเคลื่อนไหวเกินกำหนด) -> โหมด AFK
       ▼ (ถ้ายังทำงานอยู่)
[ Freebuff AI Agent ] ──────> โครงการ, Prompt, เครื่องมือที่ Freebuff กำลังใช้
       ▼ (ถ้าไม่พบ)
[ Kiro AI Agent ] ──────────> โครงการ, CWD, สถานะ Kiro CLI
       ▼ (ถ้าไม่พบ)
[ Antigravity Agent ] ──────> อ่าน transcript.jsonl (Writing, Executing, Researching)
       ▼ (ถ้าไม่พบ)
[ Other AI Agents ] ────────> Claude Code, Cursor Agent, Aider, Gemini CLI, Copilot ฯลฯ
       ▼ (ถ้าไม่พบ)
[ Terminal Editors ] ───────> Neovim, Helix, Vim, Micro, Nano, Emacs + ไฟล์ล่าสุด
       ▼ (ถ้าไม่พบ)
[ Workspace Files ] ────────> ไฟล์ที่เพิ่งบันทึก/แก้ไขใน Git ล่าสุด (ภายใน 3 นาที)
       ▼ (ถ้าไม่พบ)
[ Dev Tools / Compilers ] ──> Cargo (Rust), Bun, Deno, Docker, Go, Python ฯลฯ
       ▼ (ถ้าไม่พบ)
[ Terminal Shells ] ────────> Windows Terminal, PowerShell 7, CMD, Bash/WSL, Fish, Nushell
       ▼ (ถ้าไม่พบ)
[ Idle Project / Studio ] ──> โฟลเดอร์โปรเจกต์ปัจจุบัน หรือ Roblox Studio Experience
```

---

## 4. ระบบตรวจจับ Git & Per-File Diff Engine

### การตรวจจับไฟล์ที่กำลังแก้ไข (`getRecentlyModifiedWorkspaceFile`):
1. ดึงสถานะผ่าน `git status --porcelain -u`
2. พาร์สรหัสสถานะ 2 ตัวอักษรหน้าสุดอย่างปลอดภัย (ไม่ตัดสตริงผิดพลาด)
3. ตรวจสอบ `fs.statSync(file).mtimeMs` เพื่อหาไฟล์ที่มีการบันทึกล่าสุด
4. สกัด `subDir` ของไฟล์นั้น:
   * ถ้าอยู่ใน `src/discord-rpc.js` ➔ `📂 src/`
   * ถ้าอยู่ที่ Root ➔ `📂 root`
   * ถ้าเป็นไฟล์ใหม่ยังไม่คอมมิต (`??` หรือ `A`) ➔ แสดงป้าย `✨ ไฟล์ใหม่`
5. คำนวณ Git Diff เฉพาะไฟล์นั้น:
   * รัน `git diff HEAD --shortstat -- "<file>"`
   * ดึงจำนวนบรรทัดที่เพิ่ม/ลบ เช่น `+14 -2`

---

## 5. ระบบธีมภาษาไทย (Thai Theme Specification)

ธีม `thai` ถูกออกแบบในสไตล์ **Ultra-Compact (Subfolder Path + Per-File Diff)** เพื่อแก้ปัญหาชื่อโปรเจกต์ซ้ำซ้อน และสั้นกระชับ ไม่โดนตัดคำบนหน้าจอมือถือ (ความยาวเฉลี่ย 19 - 26 ตัวอักษร):

* **บรรทัดที่ 1 (`details`)**:
  * โหมดเขียนโค้ด: `🔥 เขียนโค้ด: <ชื่อไฟล์>` (เช่น `🔥 เขียนโค้ด: discord-rpc.js`)
  * โหมด AI Agent: `🤖 Freebuff: <งาน>` หรือ `🤖 Kiro AI พร้อมใช้งาน`
  * โหมดเทอร์มินัล: `💻 PowerShell 7 :: Zircord` หรือ `⚙️ รัน: <คำสั่ง>`
* **บรรทัดที่ 2 (`state`)**:
  * แก้ไฟล์ในโฟลเดอร์ย่อย: `📂 src/ (master) ✏️ +14 -2`
  * แก้ไฟล์หน้า Root: `📂 root (master) ✏️ +3 -1`
  * ไฟล์ใหม่ (Untracked): `📂 bin/ (master) ✨ ใหม่`
  * โค้ดสะอาด ซิงก์เรียบร้อย: `📂 Zircord (master)`
  * เทอร์มินัล: `💻 เทอร์มินัล (master)`
  * พักสายตา: `พักสายตาแป๊บเดียว`
