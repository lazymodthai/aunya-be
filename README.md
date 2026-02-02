# Aunya Backend (aunya-be)

ระบบ Backend สำหรับจัดการการจองที่พัก พัฒนาด้วย **NestJS** + **TypeORM** + **PostgreSQL**

## 🚀 Tech Stack

- **Framework:** NestJS 11
- **Database:** PostgreSQL + TypeORM
- **HTTP Server:** Fastify
- **Authentication:** JWT (Access + Refresh Token)
- **File Storage:** NIPA Cloud S3
- **Scheduled Tasks:** @nestjs/schedule
- **API Documentation:** Swagger

---

## 📁 โครงสร้างโปรเจค

```
aunya-be/
├── src/
│   ├── auth/           # ระบบยืนยันตัวตน (Login/Register/JWT)
│   ├── booking/        # จัดการการจอง
│   ├── prices/         # ราคา/ส่วนลด/Price Calendar
│   ├── files/          # อัปโหลดไฟล์ + QR Code + ตรวจสอบสลิป
│   ├── gallery/        # จัดการรูปภาพ Gallery
│   ├── settings/       # ตั้งค่าระบบ
│   ├── line-notification/ # แจ้งเตือนผ่าน LINE
│   ├── tasks/          # Scheduled Jobs
│   └── uploaded-files/ # จัดการไฟล์ที่อัปโหลด
├── entities/           # TypeORM Entities
├── constants/          # Enums และ Constants
├── config/             # Configuration files
├── middlewares/        # Middleware (Logger)
└── database/           # Database config & migrations
```

---

## ✨ ฟีเจอร์หลัก

### 1. 🔐 Authentication (Auth Module)

- **Register** - สมัครสมาชิกใหม่
- **Login** - เข้าสู่ระบบด้วย JWT (Access + Refresh Token)
- **Refresh Token** - ต่ออายุ Token
- **Logout** - ออกจากระบบ
- **Get Profile** - ดูข้อมูลผู้ใช้
- **Role-based Access** - แยกสิทธิ์ Admin / User

### 2. 📅 Booking (Booking Module)

- **สร้างการจอง** - จองห้องพักพร้อมข้อมูลลูกค้า
- **ค้นหาการจอง** - ค้นหาด้วย refCode / phoneNumber / วันที่
- **เปลี่ยนสถานะ** - Payment → Pending → Confirmed → CheckedIn → CheckedOut / Cancelled
- **ดึงวันที่ไม่ว่าง** - สำหรับแสดง Calendar
- **My Bookings** - ดูการจองของตัวเอง (สำหรับ User)

**สถานะการจอง:**
| Status | ความหมาย |
|--------|----------|
| Payment | รอชำระเงิน |
| Pending | รอยืนยัน |
| Confirmed | ยืนยันแล้ว |
| CheckedIn | เช็คอินแล้ว |
| CheckedOut | เช็คเอาท์แล้ว |
| Cancelled | ยกเลิก |

### 3. 💰 Prices (Prices Module)

- **Generate Prices** - สร้างราคาสำหรับห้องตามปี/เดือน
- **Price Calendar** - ราคาตามวัน (Weekday/Weekend/Holiday)
- **Update Price** - แก้ไขราคาแต่ละวัน
- **Maintenance Mode** - กำหนดวันปิดซ่อมบำรุง
- **Reset Prices** - ลบราคาเพื่อสร้างใหม่
- **Calculate Price** - คำนวณราคารวมสำหรับช่วงวันที่

### 4. 🏷️ Discount Codes

- **Generate Discount Code** - สร้างโค้ดส่วนลด (จำนวนเงิน / %)
- **Get Discount Code** - ตรวจสอบโค้ดส่วนลด
- **Use Discount Code** - ใช้โค้ด (ลด count)
- **Get All Discount Codes** - ดูโค้ดทั้งหมด (Admin)

### 5. 📁 Files (Files Module)

- **Upload File** - อัปโหลดไฟล์ไปยัง NIPA S3
- **Slip Verification** - ตรวจสอบสลิปโอนเงินจาก QR Code
- **Generate QR Code** - สร้าง PromptPay QR Code
- **Download File** - ดาวน์โหลดไฟล์
- **Delete File** - ลบไฟล์

### 6. 🖼️ Gallery (Gallery Module)

- **Upload Image** - อัปโหลดรูปภาพสำหรับ SwiperSlide
- **Get All Images** - ดึงรูปทั้งหมดเรียงตาม sortOrder
- **Update Sort Order** - เปลี่ยนลำดับการแสดงผล
- **Update Alt Text** - แก้ไข alt text
- **Delete Image** - ลบรูปภาพ

### 7. ⚙️ Settings (Settings Module)

- **Get All Settings** - ดูการตั้งค่าทั้งหมด
- **Get Setting by Key** - ดูค่าตาม key
- **Update Setting** - อัปเดตค่า (Admin)
- **Create Setting** - สร้างการตั้งค่าใหม่ (Admin)

### 8. 📱 LINE Notification

- **Booking Notification** - แจ้งเตือนเมื่อมีการจองใหม่
- **Test Message** - ส่งข้อความทดสอบ
- สามารถเปิด/ปิดได้จาก Settings

### 9. 🕒 Scheduled Tasks

- **QR Code Cleanup** - ลบ QR Code เก่าทุก 10 นาที

---

## 📦 Database Entities

| Entity           | คำอธิบาย              |
| ---------------- | --------------------- |
| `users`          | ข้อมูลผู้ใช้งาน       |
| `rooms`          | ข้อมูลห้องพัก         |
| `booking`        | ข้อมูลการจอง          |
| `price_calendar` | ราคาห้องตามวัน        |
| `discount_codes` | โค้ดส่วนลด            |
| `slip`           | ข้อมูลสลิปการชำระเงิน |
| `settings`       | การตั้งค่าระบบ        |
| `session`        | Session ของผู้ใช้     |
| `uploaded_file`  | ไฟล์ที่อัปโหลด        |
| `gallery`        | รูปภาพ Gallery        |

---

## 🛠️ การติดตั้งและรันโปรเจค

### Prerequisites

- Node.js 18+
- PostgreSQL
- Yarn 4.x

### 1. Clone และติดตั้ง Dependencies

```bash
git clone <repo-url>
cd aunya-be
yarn install
```

### 2. ตั้งค่า Environment

สร้างไฟล์ `.env.development`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=aunya_db

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# NIPA Cloud S3
NIPA_CLOUD_ACCESS_KEY=your_access_key
NIPA_CLOUD_SECRET_KEY=your_secret_key
NIPA_CLOUD_BUCKET_NAME=your_bucket
NIPA_CLOUD_ENDPOINT=https://s3.nipa.cloud

# LINE Notification
LINE_CHANNEL_ACCESS_TOKEN=your_line_token
LINE_GROUP_ID=your_group_id

# Slip Verification
SLIP_VERIFICATION_API=https://api.slipok.com
```

### 3. รันโปรเจค

```bash
# Development
yarn start:dev

# Production
yarn build
yarn start:prod
```

### 4. API Documentation

เปิด Swagger UI ที่ `http://localhost:3000/api`

---

## 🐳 Docker

```bash
# Build และรัน
docker compose up -d --build
```

---

## 📋 Scripts

| Command                 | คำอธิบาย                     |
| ----------------------- | ---------------------------- |
| `yarn start:dev`        | รัน Development mode (watch) |
| `yarn start:prod`       | รัน Production               |
| `yarn build`            | Build project                |
| `yarn lint`             | ตรวจสอบ code style           |
| `yarn test`             | รัน unit tests               |
| `yarn migration:run`    | รัน migrations               |
| `yarn migration:revert` | Revert migration             |

---

## 🔮 แนวทางพัฒนาต่อ

### Phase 1: ปรับปรุงระบบปัจจุบัน

1. **🔒 Security Enhancements**
   - เพิ่ม rate limiting สำหรับ API
   - Implement CORS configuration ที่เข้มงวดขึ้น
   - เพิ่ม API key สำหรับ external services

2. **📊 Logging & Monitoring**
   - เพิ่ม structured logging (Winston)
   - Integrate กับ monitoring tools (e.g., Prometheus, Grafana)
   - Error tracking (e.g., Sentry)

3. **✅ Testing**
   - เพิ่ม Unit tests ให้ครบทุก service
   - เพิ่ม E2E tests สำหรับ critical flows
   - Coverage report

### Phase 2: ฟีเจอร์ใหม่

4. **📧 Notification System**
   - Email notifications (booking confirmation)
   - SMS notifications
   - Push notifications (Firebase)

5. **📈 Analytics & Reporting**
   - Dashboard สรุปยอดจอง
   - รายงานรายได้
   - Export to Excel/PDF

6. **💳 Payment Integration**
   - เชื่อมต่อ Payment Gateway (Stripe, Omise)
   - Auto-verify payment
   - Refund management

7. **📆 Room Management**
   - CRUD rooms
   - Room types & categories
   - Room amenities
   - Multiple images per room

### Phase 3: Scalability

8. **🏗️ Infrastructure**
   - Redis caching
   - Queue system (Bull/BullMQ) สำหรับ async tasks
   - Database connection pooling
   - Horizontal scaling

9. **🔄 CI/CD**
   - GitHub Actions workflow
   - Automated testing
   - Auto deployment to staging/production

10. **📱 Mobile API**
    - GraphQL API
    - WebSocket for real-time updates
    - Mobile-optimized endpoints

### Phase 4: Advanced Features

11. **🤖 Automation**
    - Auto-reminder ก่อนเช็คอิน
    - Auto-cancel booking ที่ไม่ชำระเงิน
    - Dynamic pricing based on demand

12. **🌐 Multi-tenant**
    - รองรับหลายที่พัก
    - Tenant-based data isolation
    - Admin dashboard per tenant

---

## 👥 Contributors

- LazyModThai Team

---

## 📄 License

UNLICENSED - Private Project
