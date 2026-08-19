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
- **products** - รายการเมนูอาหาร
- **inventory** - คลังวัตถุดิบและสต็อก
- **orders** - บันทึกคำสั่งซื้อ
- **order_items** - รายการอาหารในแต่ละคำสั่งซื้อ
- **payments** - บันทึกการชำระเงินพร้อมข้อมูล QR Code
- **order_queue** - คิวคำสั่งซื้อที่ห้องครัวต้องทำ
- **payment_history** - ประวัติการชำระเงิน
- **stock_logs** - ประวัติการเข้าออกของสต็อกวัตถุดิบ
- **carts** - ตะกร้าสินค้า

## สิทธิ์การเข้าถึงระบบ (Role-Based Access Control)

| สิทธิ์ผู้ใช้งาน | รายงาน (Reports) | คลังสินค้า (Inventory) | คำสั่งซื้อ (Orders) | การชำระเงิน (Payments) |
|------|---------|-----------|--------|----------|
| **Admin** | ✅ เข้าถึงได้เต็มรูปแบบ | ✅ เต็มรูปแบบ | ✅ เต็มรูปแบบ | ✅ เต็มรูปแบบ |
| **Manager** | ✅ ยอดขาย/บทวิเคราะห์ | ✅ ดู/แก้ไข | ✅ เต็มรูปแบบ | ✅ ดูข้อมูล |
| **Chef** | ❌ | ❌ | ✅ ดูคิวออเดอร์ | ❌ |
| **Staff** | ❌ | ❌ | ✅ เต็มรูปแบบ | ✅ ยืนยันการชำระ |
| **Customer** | ❌ | ❌ | ✅ ออเดอร์ของตนเอง | ✅ ของตนเอง |

## เส้นทางของ API (API Endpoints)

### ยืนยันตัวตน (Authentication)
- `POST /api/auth/register` - สมัครสมาชิก
- `POST /api/auth/login` - เข้าสู่ระบบ

### เมนูอาหาร (Products)
- `GET /api/products` - เรียกดูเมนูอาหารทั้งหมด
- `POST /api/products` - เพิ่มเมนู (Admin/Manager)
- `PUT /api/products/:id` - แก้ไขเมนู (Admin/Manager)
- `DELETE /api/products/:id` - ลบเมนู (Admin/Manager)

### คำสั่งซื้อ (Orders)
- `GET /api/orders` - ดูคำสั่งซื้อทั้งหมด
- `POST /api/orders` - สร้างคำสั่งซื้อใหม่ (Guest ก็สามารถใช้ได้)
- `PUT /api/orders/:id/status` - อัปเดตสถานะคำสั่งซื้อ

### การชำระเงิน (Payments)
- `POST /api/payments/create/:order_id` - สร้าง QR Code 
- `PUT /api/payments/:order_id/verify` - ยืนยันการชำระเงิน
- `GET /api/payments/history/all` - ประวัติการชำระเงิน

### รายงาน (Reports) - เฉพาะ Admin/Manager
- `GET /api/reports/sales` - รายงานยอดขาย
- `GET /api/reports/summary/weekly` - สรุปรายสัปดาห์
- `GET /api/reports/summary/monthly` - สรุปรายเดือน
- `GET /api/reports/products/top` - เมนูยอดฮิต
- `GET /api/reports/analytics/summary` - บทวิเคราะห์ภาพรวม

### คลังสินค้า (Inventory)
- `GET /api/inventory` - ดูสต็อกสินค้า
- `POST /api/inventory` - เพิ่มสินค้าในสต็อก (Manager/Admin)
- `PUT /api/inventory/:id` - ปรับจำนวนสต็อก (Manager/Admin)
- `GET /api/inventory/alerts/low-stock` - แจ้งเตือนสินค้าใกล้หมด

## ฟีเจอร์ที่มีในระบบ (Features)

✅ ระบบยืนยันตัวตนด้วย JWT
✅ การจัดการสิทธิ์แบบกลุ่ม (Role-based)
✅ ระบบจัดการเมนูอาหาร
✅ ตะกร้าสินค้าสั่งอาหาร
✅ สร้าง QR Code PromptPay สำหรับจ่ายเงิน
✅ ติดตามสถานะออเดอร์แบบเรียลไทม์
✅ ระบบตัดสต็อกอัตโนมัติและแจ้งเตือนของใกล้หมด
✅ รายงานยอดขายและการเงินแบบกราฟ (Admin/Manager เท่านั้น)
✅ เก็บประวัติความเคลื่อนไหวสต็อก
✅ ระบบคิวในห้องครัว
✅ รันระบบง่ายๆ ด้วย Docker container

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