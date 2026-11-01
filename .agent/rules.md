# 📜 กฎเหล็กและข้อกำหนดสำหรับ Agent (Agent Rules & Standards)

AI Agents ทุกตัวที่ทำงานใน Codebase นี้ **ต้องปฏิบัติตามกฎด้านล่างอย่างเคร่งครัดโดยไม่มีข้อยกเว้น**:

---

### 1. 🛡️ Zero External Dependencies (ห้ามเพิ่ม npm packages)
* **ข้อกำหนด**: Zircord ต้องรันได้ทันทีบนคอมพิวเตอร์ทุกเครื่องที่มี Node.js โดยไม่ต้องสั่ง `npm install`
* **แนวทาง**:
  * ใช้เฉพาะโมดูล Built-in ของ Node.js: `net`, `path`, `fs`, `child_process`
  * ห้ามติดตั้งไลบรารีภายนอก (เช่น `discord-rpc`, `ws`, `axios`, `express`, `chalk` ฯลฯ)
  * ใช้ดิบ Net Socket ติดต่อ Discord IPC เสมอ

---

### 2. ⚡ Non-Blocking Execution & Performance Guard
* **ข้อกำหนด**: Daemon รันวนลูปทุก 5 วินาที กระบวนการตรวจจับต้องไม่ดึง CPU และห้ามบล็อก Event Loop
* **แนวทาง**:
  * การสแกนโปรเซส (`tasklist / ps`) ต้องทำแบบ Asynchronous (`exec`) และมีแคชหน่วงเวลาอย่างน้อย 3,000ms
  * คำสั่ง `execSync` ใดๆ ต้องมี `{ timeout: 1000 }` และครอบ `try { ... } catch {}` เสมอ เพื่อไม่ให้ daemon แคชเมื่อมี IO ติดขัด
  * ห้ามวนลูปอ่านไฟล์ขนาดใหญ่ ให้ใช้ `fs.openSync` + `Buffer` อ่านเฉพาะไบต์ท้ายสุด (Tail Reading) เช่นไฟล์ Log ของ Roblox หรือ Transcript

---

### 3. 🌐 Cross-Platform Path & Environment Handling
* **ข้อกำหนด**: โค้ดต้องรองรับทั้ง Windows และ Unix-like (Linux, macOS, WSL)
* **แนวทาง**:
  * ใช้ `process.env.USERPROFILE || process.env.HOME` ในการหา User Home
  * ใช้ `path.join()` หรือ `path.resolve()` แทนการต่อสตริงพาธตรงๆ
  * หากตัดสตริงพาธที่ได้จาก Git (ซึ่งมักใช้ `/`) ให้แปลง `\\` เป็น `/` สม่ำเสมอก่อนนำไปแสดงผล

---

### 4. 🔍 Git Porcelain Parsing Invariant (ระวังบั๊กตัดสตริง)
* **ข้อกำหนด**: ห้ามใช้ `line.trim().slice(3)` กับผลลัพธ์ของ `git status --porcelain`
* **เหตุผล**: ผลลัพธ์ของ Git Porcelain มีรหัส 2 ตัวอักษรตามด้วยวรรค เช่น ` M filename.js` หากใช้ `trim()` วรรคหน้าจะหายไป ทำให้ `slice(3)` ไปกินตัวอักษรแรกของชื่อไฟล์ (`ilename.js`)
* **แนวทางที่ถูกต้อง**:
  ```javascript
  const statusCode = line.slice(0, 2).trim();
  const rawFile = line.slice(3).trim().replace(/^["']|["']$/g, "");
  ```

---

### 5. 🔄 Dual Synchronization & Daemon Refresh
* **ข้อกำหนด**: ระบบมีไฟล์สคริปต์ 2 ตำแหน่ง:
  1. โปรเจกต์ปัจจุบัน: `C:\Users\ZirconX\Documents\Zircord\src\discord-rpc.js`
  2. โกลบอลสคริปต์: `%USERPROFILE%\.gemini\scripts\discord-rpc.js`
* **แนวทาง**:
  * ทุกครั้งที่แก้ไขโค้ดใน `src/discord-rpc.js` ต้องคัดลอกทับไปยังโกลบอลสคริปต์ด้วยเสมอ
  * หลังแก้ไข ต้องทดสอบความสมบูรณ์ด้วยคำสั่ง `node src/discord-rpc.js status`
  * สั่งรีสตาร์ต Daemon (`stop` แล้ว `start`) เพื่อให้การตั้งค่าใหม่มีผลบน Discord ทันที

---

### 6. 📱 Mobile Truncation Safety (การแสดงผลบน Discord Card)
* **ข้อกำหนด**: การ์ดแสดงผลของ Discord บนมือถือมีความกว้างจำกัด (~32-40 ตัวอักษร)
* **แนวทาง**:
  * บรรทัดที่ 1 (`details`): แสดง Action หรือสิ่งที่กำลังทำ เช่น `🔥 เขียนโค้ด: file.ext`
  * บรรทัดที่ 2 (`state`): แสดง Context เช่น `📂 src/ • 🌿 master • ✏️ +14 -2`
  * หลีกเลี่ยงข้อความที่ซ้ำซ้อนกับปุ่มกด (เช่น ไม่ต้องใส่ชื่อโปรเจกต์ซ้ำ เพราะปุ่มพาไปยัง GitHub Repo อยู่แล้ว)
  * ปุ่มกด (Buttons) ใน Rich Presence ไม่สามารถเปลี่ยนสีได้โดย Discord API แต่สามารถตกแต่งด้วยไอคอนหรือข้อความกระชับได้

---

### 7. 🧪 Verification Before Sign-off
* **ข้อกำหนด**: ห้ามส่งมอบงานโดยไม่ได้ทดสอบการรันจริง
* **แนวทาง**:
  * รัน Node syntax check หรือสคริปต์จำลอง
  * ตรวจสอบว่าไม่มีตัวแปรที่ `undefined` หรือฟังก์ชันที่ไม่ได้ประกาศ (เช่น กรณี `getKiroActivity`)
  * ตรวจสอบว่าคำสั่ง `status` รายงานสถานะถูกต้องและไม่โยน Unhandled Exception
