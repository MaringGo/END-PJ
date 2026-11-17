# 🍽️ Restaurant Management System (ระบบจัดการร้านอาหาร)

เว็บแอปพลิเคชันแบบ Full-stack สำหรับจัดการร้านอาหารครบวงจร รองรับการประมวลผลคำสั่งซื้อ, การติดตามสต็อกวัตถุดิบ, การชำระเงินด้วย QR Code และระบบรายงานแยกตามสิทธิ์การใช้งาน (Role-based)

## โครงสร้างโปรเจกต์ (Project Structure)

```
END-PJ/
├── backend/              # ระบบหลังบ้าน (Express.js API)
│   ├── src/
│   │   ├── server.js     # จุดเริ่มต้นของแอปพลิเคชันหลัก
│   │   ├── routes/       # API endpoints (เส้นทางเชื่อมต่อ)
│   │   ├── middleware/   # ระบบตรวจสอบสิทธิ์ (Auth & Role)
│   │   └── database/     # ชุดคำสั่งสร้างฐานข้อมูล
│   ├── package.json
│   └── .env.example
│
├── frontend/             # ระบบหน้าบ้าน (Vue 3 + Vite)
│   ├── src/
│   │   ├── App.vue
│   │   ├── main.js
│   │   ├── router/       # ตัวจัดการหน้าเว็บ (Vue Router)
│   │   ├── views/        # คอมโพเนนต์ของแต่ละหน้า
│   │   └── index.css     # สไตล์หลัก (Tailwind CSS)
│   ├── package.json
│   └── .env.example
│
├── docker/               # การตั้งค่า Docker
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
│
├── docker-compose.yml    # การตั้งค่ารันแบบหลายคอนเทนเนอร์
└── planPJ.md            # แผนงานและข้อกำหนดของโปรเจกต์
```

## เทคโนโลยีที่ใช้งาน (Tech Stack)

**ระบบหลังบ้าน (Backend):**
- Node.js + Express.js
- PostgreSQL
- ระบบยืนยันตัวตน JWT + เข้ารหัสด้วย bcrypt
- RESTful API

**ระบบหน้าบ้าน (Frontend):**
- Vue 3 + Vite
- TailwindCSS + daisyUI
- Vue Router
- Axios

**โครงสร้างพื้นฐาน (Infrastructure):**
- Docker & Docker Compose

## เริ่มต้นใช้งาน (Quick Start)

### สิ่งที่ต้องมี
- Node.js ตั้งแต่เวอร์ชัน 18 ขึ้นไป
- PostgreSQL ตั้งแต่เวอร์ชัน 14 ขึ้นไป
- Docker & Docker Compose (ทางเลือก)

### ทางเลือกที่ 1: การพัฒนาบนเครื่องตัวเอง (Local Development)

1. **โคลนโปรเจกต์ลงเครื่อง**
   ```bash
   git clone https://github.com/MaringGo/END-PJ.git
   cd END-PJ
   ```

2. **ตั้งค่าระบบหลังบ้าน (Backend)**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # แก้ไขไฟล์ .env ด้วยข้อมูลการเชื่อมต่อฐานข้อมูลของคุณ
   npm run dev
   ```
   Backend จะรันอยู่ที่ http://localhost:5000

3. **ตั้งค่าระบบหน้าบ้าน (Frontend)**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   npm run dev
   ```
   Frontend จะรันอยู่ที่ http://localhost:3000

### ทางเลือกที่ 2: รันด้วย Docker Compose

```bash
docker-compose up --build
```

คำสั่งนี้จะเริ่มต้นระบบ:
- ฐานข้อมูล PostgreSQL ที่ localhost:5432
- Backend API ที่ localhost:5000
- Frontend หน้าเว็บที่ localhost:3000

## โครงสร้างฐานข้อมูล (Database Schema)

- **users** - บัญชีผู้ใช้พร้อมสิทธิ์การใช้งาน (admin, manager, chef, staff, customer)
- **categories** - หมวดหมู่อาหาร
- **products** - รายการเมนูอาหาร (ราคา, หมวดหมู่)
- **inventory** - คลังสต็อกวัตถุดิบ (ชื่อวัตถุดิบ, ปริมาณ, หน่วย, จุดเตือนขั้นต่ำ, สถานะ ok/low_stock/out_of_stock)
- **product_ingredients** - สูตรอาหารเชื่อมโยงวัตถุดิบ (product_id, inventory_id, quantity_used)
- **orders** - บันทึกคำสั่งซื้อ (order_code, table_no, total_price, status 6 ขั้นตอน, payment_status unpaid/paid)
- **order_items** - รายการอาหารในแต่ละคำสั่งซื้อ
- **payments** - บันทึกการชำระเงินพร้อมข้อมูล QR Code PromptPay หรือเงินสด
- **order_queue** - คิวคำสั่งซื้อที่ห้องครัวต้องทำ
- **payment_history** - ประวัติการชำระเงิน
- **stock_logs** - ประวัติความเคลื่อนไหวสต็อกวัตถุดิบ (การสั่งอาหารตัดสต็อก, การยกเลิกคืนสต็อก, การปรับปรุงสต็อก)
- **carts** - ตะกร้าสินค้า

## วงจรคำสั่งซื้อ 6 ขั้นตอน (Order Workflow & Dine-in Pay-after-eating)

ระบบปรับใช้รูปแบบรับประทานอาหารที่ร้าน (Dine-in) โดยสั่งอาหารก่อนแล้วชำระเงินเมื่อรับประทานเสร็จ:

```
[1. รับออเดอร์] ➔ [2. ยืนยันออเดอร์] ➔ [3. ลงมือทำอาหาร] ➔ [4. อาหารเสร็จรอเสิร์ฟ] ➔ [5. เสิร์ฟสำเร็จ] ➔ [6. ชำระเงิน/จ่ายตัง]
  (pending)         (confirmed)          (preparing)             (ready)            (served)            (completed)
  payment: unpaid                                                                                       payment: paid
```

1. **รับออเดอร์ (pending):** ลูกค้าเลือกหมายเลขโต๊ะ (โต๊ะ 1-10 หรือ สั่งกลับบ้าน) ส่งออเดอร์เข้าครัว สถานะเริ่มต้นเป็น `pending` และ `payment_status: unpaid` พร้อมตัดสต็อกวัตถุดิบตามสูตรอาหาร
2. **ยืนยันออเดอร์ (confirmed):** พนักงาน/แคชเชียร์ตรวจสอบและกดยืนยันออเดอร์เข้าสู่คิวปรุงอาหาร
3. **ลงมือทำอาหาร (preparing):** ฝ่ายครัว (Chef/Kitchen) กดเริ่มปรุงอาหาร
4. **อาหารเสร็จรอเสิร์ฟ (ready):** ฝ่ายครัวปรุงเสร็จ แจ้งเตือนพนักงานเสิร์ฟ
5. **เสิร์ฟสำเร็จ (served):** พนักงานเสิร์ฟอาหารขึ้นโต๊ะ ลูกค้ารับประทานอาหาร
6. **ชำระเงิน/จ่ายตัง (completed):** เมื่อรับประทานเสร็จ ลูกค้าหรือพนักงานสามารถเปิด QR Code PromptPay หรือชำระด้วยเงินสด เมื่อยืนยันการชำระเงิน ระบบจะเปลี่ยนสถานะเป็น `completed` และ `payment_status: paid` ทันที

## สิทธิ์การเข้าถึงระบบ (Role-Based Access Control)

| สิทธิ์ผู้ใช้งาน | รายงาน (Reports) | คลังวัตถุดิบ (Inventory) | คำสั่งซื้อ (Orders) | การชำระเงิน (Payments) |
|------|---------|-----------|--------|----------|
| **Admin** | ✅ เข้าถึงได้เต็มรูปแบบ | ✅ จัดการเต็มรูปแบบ | ✅ จัดการเต็มรูปแบบ | ✅ จัดการเต็มรูปแบบ |
| **Manager** | ✅ ยอดขาย/บทวิเคราะห์ | ✅ ดู/เพิ่ม/แก้ไข/ลบ | ✅ จัดการเต็มรูปแบบ | ✅ ดูข้อมูล/เช็คบิล |
| **Chef** | ❌ | ❌ | ✅ ดูคิว/เปลี่ยนสถานะครัว | ❌ |
| **Staff** | ❌ | ❌ | ✅ จัดการ/เสิร์ฟ/เช็คบิล | ✅ ยืนยันการชำระเงิน |
| **Customer** | ❌ | ❌ | ✅ ออเดอร์ของตนเอง | ✅ สแกนจ่ายออเดอร์ตนเอง |

## เส้นทางของ API (API Endpoints)

### ยืนยันตัวตน (Authentication)
- `POST /api/auth/register` - สมัครสมาชิก
- `POST /api/auth/login` - เข้าสู่ระบบ
- `GET /api/auth/profile` - ดูข้อมูลโปรไฟล์

### เมนูอาหาร (Products)
- `GET /api/products` - เรียกดูเมนูอาหารทั้งหมด
- `GET /api/products/categories` - หมวดหมู่อาหาร
- `POST /api/products` - เพิ่มเมนู (Admin/Manager)
- `PUT /api/products/:id` - แก้ไขเมนู (Admin/Manager)
- `DELETE /api/products/:id` - ลบเมนู (Admin/Manager)

### คำสั่งซื้อ (Orders)
- `GET /api/orders` - ดูคำสั่งซื้อทั้งหมด (Customer เห็นเฉพาะของตนเอง, Staff/Admin เห็นทั้งหมด)
- `GET /api/orders/:id` - ดูรายละเอียดคำสั่งซื้อ
- `GET /api/orders/track/:orderCode` - ติดตามสถานะออเดอร์สำหรับลูกค้า Guest
- `POST /api/orders` - สร้างคำสั่งซื้อใหม่ (ระบุ `table_no`, ตัดสต็อกวัตถุดิบตามสูตรอาหาร)
- `PUT /api/orders/:id/status` - ปรับสถานะคำสั่งซื้อตาม 6 ขั้นตอน (ถ้ายกเลิกจะคืนวัตถุดิบเข้าคลัง)

### คลังสต็อกวัตถุดิบ (Raw Materials Inventory)
- `GET /api/inventory` - ดูรายการวัตถุดิบทั้งหมด เรียงตามสถานะเตือน
- `GET /api/inventory/alerts/low-stock` - แจ้งเตือนวัตถุดิบใกล้หมด/หมดสต็อก
- `GET /api/inventory/:id` - ดูข้อมูลวัตถุดิบตาม ID
- `POST /api/inventory` - เพิ่มวัตถุดิบใหม่ (Admin/Manager)
- `PUT /api/inventory/:id` - ปรับปรุงชื่อ/จำนวน/หน่วย/จุดเตือนวัตถุดิบ (Admin/Manager)
- `DELETE /api/inventory/:id` - ลบวัตถุดิบ (Admin/Manager)

### การชำระเงิน (Payments) - ชำระเงินหลังทานอาหารเสร็จ
- `GET /api/payments/:order_id` - ดูข้อมูลการชำระเงินของออเดอร์
- `POST /api/payments/create/:order_id` - สร้าง QR Code PromptPay ตามยอดสุทธิ
- `PUT /api/payments/:order_id/verify` - ยืนยันการชำระเงิน (PromptPay หรือเงินสด) ปิดออเดอร์เป็น `completed` และ `paid`
- `GET /api/payments/history/all` - ประวัติการชำระเงิน

### รายงาน (Reports) - เฉพาะ Admin/Manager
- `GET /api/reports/sales` - รายงานยอดขาย
- `GET /api/reports/summary/weekly` - สรุปรายสัปดาห์
- `GET /api/reports/summary/monthly` - สรุปรายเดือน
- `GET /api/reports/products/top` - เมนูยอดฮิต
- `GET /api/reports/analytics/summary` - บทวิเคราะห์ภาพรวม

## ฟีเจอร์ที่มีในระบบ (Features)

✅ ระบบยืนยันตัวตนด้วย JWT พร้อม Role-based Access Control
✅ ระบบเมนูอาหารและแยกหมวดหมู่
✅ **ระบบสต็อกวัตถุดิบ (Raw Materials Inventory)**: จัดการวัตถุดิบแยกจากเมนูอาหาร รองรับทศนิยมและหน่วยวัด
✅ **ระบบตัดสต็อกตามสูตรอาหาร (Recipe / Product Ingredients)**: เมื่อสั่งอาหารจะคำนวณและตัดสต็อกวัตถุดิบอัตโนมัติ
✅ **ระบบคืนสต็อกวัตถุดิบอัตโนมัติ**: เมื่อมีการยกเลิกออเดอร์
✅ **ระบบชำระเงินหลังทานอาหารเสร็จ (Pay-after-eating)**: ออเดอร์เริ่มต้นด้วยสถานะ `unpaid` และชำระเงินเมื่อทานเสร็จ
✅ **วงจรสถานะออเดอร์ 6 ขั้นตอน**: รับออเดอร์ ➔ ยืนยัน ➔ ลงมือทำ ➔ รอเสิร์ฟ ➔ เสิร์ฟสำเร็จ ➔ จ่ายตัง
✅ หน้าจอครัว (Kitchen Display System) แบบแยกแท็บ 6 ขั้นตอน พร้อมระบบเช็คบิล/รับชำระเงินสดและ PromptPay
✅ หน้าจอติดตามคำสั่งซื้อ (Orders Stepper) แสดงขั้นตอนสถานะอาหารแบบเรียลไทม์ และปุ่มสแกนจ่ายเงินเมื่อเสิร์ฟแล้ว
✅ เลือกระบุหมายเลขโต๊ะ (โต๊ะ 1-10 หรือ สั่งกลับบ้าน)
✅ รายงานยอดขายและการเงินแบบกราฟ (Admin/Manager เท่านั้น)
✅ บันทึกประวัติการเปลี่ยนแปลงสต็อก (Stock Logs) อย่างละเอียด

## การพัฒนา (Development)

### การสร้างฐานข้อมูลเริ่มต้น

เมื่อเซิร์ฟเวอร์หลังบ้านเริ่มต้นขึ้น ตารางต่างๆ จะถูกสร้างให้โดยอัตโนมัติ หากต้องการรันโค้ดแบบ Manual:

```javascript
import { initializeDatabase } from './src/database/init.js';
await initializeDatabase();
```

### ตัวแปรสภาพแวดล้อม (Environment Variables)

**ระบบหลังบ้าน (.env)**
```
PORT=5000
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=restaurant_db
JWT_SECRET=your_secret_key_change_in_production
NODE_ENV=development
```

**ระบบหน้าบ้าน (.env)**
```
PORT=3000
VITE_API_URL=http://localhost:5000
```

## การแก้ปัญหาเบื้องต้น (Troubleshooting)

### เชื่อมต่อฐานข้อมูลไม่ได้
- ตรวจสอบว่า PostgreSQL เปิดทำงานอยู่หรือไม่
- เช็ค Username/Password ในไฟล์ .env
- เช็ค DB_HOST (ใช้ `postgres` หากรันบน Docker หรือ `localhost` หากรันบนเครื่อง)

### ติดปัญหาพอร์ตซ้ำ (Port Already in Use)
- เปลี่ยนค่า PORT ในไฟล์ .env
- หรือสั่งหยุดการทำงานเก่า: `lsof -i :5000` (บน macOS/Linux)

### ปัญหาเกี่ยวกับ Docker
- ล้างแคช: `docker-compose down -v`
- บิลด์ระบบใหม่: `docker-compose up --build --force-recreate`

## ข้อมูลเพิ่มเติม

ระบบได้รับการอัปเดตให้รองรับ **Guest Checkout (สแกนสั่งซื้อโดยไม่ต้องเข้าสู่ระบบ)** เรียบร้อยแล้ว

---

**ปรับปรุงล่าสุด**: สิงหาคม 2569