# 🔔 Push Notification System

ระบบ Push Notification ที่ใช้ Next.js, Service Worker และ Web Push API สำหรับส่งการแจ้งเตือนแบบ Real-time

## 📋 สารบัญ

- [คุณสมบัติ](#คุณสมบัติ)
- [เทคโนโลยีที่ใช้](#เทคโนโลยีที่ใช้)
- [การติดตั้ง](#การติดตั้ง)
- [การใช้งาน](#การใช้งาน)
- [หลักการทำงาน](#หลักการทำงาน)
- [โครงสร้างโปรเจค](#โครงสร้างโปรเจค)
- [API Endpoints](#api-endpoints)
- [การจัดการ Subscription](#การจัดการ-subscription)
- [การแก้ไขปัญหา](#การแก้ไขปัญหา)

## ✨ คุณสมบัติ

- ✅ ส่ง Push Notification แบบ Real-time
- ✅ รองรับหลาย Browser (Chrome, Edge, Firefox)
- ✅ Dashboard สำหรับจัดการและส่ง Notification
- ✅ ระบบจัดการ Subscription อัตโนมัติ
- ✅ ลบ Subscription ที่หมดอายุอัตโนมัติ
- ✅ ดูประวัติการส่งและสถิติ

## 🛠️ เทคโนโลยีที่ใช้

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Push Service**: Web Push API, Firebase Cloud Messaging (FCM)
- **Service Worker**: สำหรับจัดการ Push Events
- **Package**: web-push, @types/web-push

## 🚀 การติดตั้ง

### 1. Clone โปรเจค
```bash
git clone <repository-url>
cd pwa-noti
```

### 2. ติดตั้ง Dependencies
```bash
npm install
```

### 3. สร้าง VAPID Keys
```bash
node generateVapidKeys.js
```

### 4. ตั้งค่า Environment Variables
สร้างไฟล์ `.env.local`:
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_EMAIL=your_email@example.com
```

### 5. รันโปรเจค
```bash
npm run dev
```

เปิดเว็บไซต์ที่: `http://localhost:3000`

## 📖 การใช้งาน

### 1. หน้าแรก (Home)
- เปิดเว็บไซต์และอนุญาต Notification
- ระบบจะลงทะเบียน Service Worker และสร้าง Subscription อัตโนมัติ

### 2. Dashboard (`/dashboard`)
- ดูจำนวน Active Subscriptions
- ส่ง Notification ผ่าน UI
- ดูผลลัพธ์การส่งล่าสุด
- จัดการ Subscriptions

### 3. API Testing
ใช้ Postman หรือ curl:
```bash
# ส่ง Notification
curl -X POST http://localhost:3000/api/send-notification \
  -H "Content-Type: application/json" \
  -d '{"title":"ทดสอบ","body":"นี่คือข้อความทดสอบ"}'

# ดู Subscriptions
curl http://localhost:3000/api/save-subscription
```

## 🔄 หลักการทำงาน

### 1. การลงทะเบียน (Registration)
```
Browser → Service Worker → Push Manager → Subscription → Backend
```

1. **ลงทะเบียน Service Worker**: `navigator.serviceWorker.register('/sw.js')`
2. **ขอสิทธิ์ Notification**: `Notification.requestPermission()`
3. **สร้าง Push Subscription**: `pushManager.subscribe()`
4. **ส่งไป Backend**: POST `/api/save-subscription`

### 2. การส่ง Notification
```
Backend → Web Push → FCM → Browser → Service Worker → Notification
```

1. **Backend ส่ง**: `webpush.sendNotification(subscription, payload)`
2. **FCM รับและส่งต่อ**: Firebase Cloud Messaging
3. **Browser รับ**: Service Worker รับ push event
4. **แสดง Notification**: `registration.showNotification()`

### 3. การจัดการ Subscription
- **ตรวจสอบ**: ทุกครั้งที่ส่ง notification
- **ลบอัตโนมัติ**: subscription ที่หมดอายุ (status 410)
- **เก็บสถิติ**: จำนวน success/fail

## 📁 โครงสร้างโปรเจค

```
pwa-noti/
├── app/
│   ├── api/
│   │   ├── save-subscription/
│   │   │   └── route.ts          # เก็บและดู subscriptions
│   │   └── send-notification/
│   │       └── route.ts          # ส่ง notifications
│   ├── dashboard/
│   │   └── page.tsx              # Dashboard UI
│   ├── layout.tsx
│   └── page.tsx                  # หน้าแรก
├── components/
│   └── PushManager.tsx           # จัดการ Push Registration
├── public/
│   └── sw.js                     # Service Worker
├── generateVapidKeys.js          # สร้าง VAPID Keys
└── package.json
```

## 🔌 API Endpoints

### POST `/api/save-subscription`
**เก็บ Push Subscription**
```typescript
// Request
{
  "endpoint": "https://fcm.googleapis.com/...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}

// Response
{
  "message": "Subscription saved."
}
```

### GET `/api/save-subscription`
**ดู Subscriptions ทั้งหมด**
```typescript
// Response
{
  "subscriptions": [...],
  "count": 2
}
```

### POST `/api/send-notification`
**ส่ง Notification**
```typescript
// Request
{
  "title": "หัวข้อ",
  "body": "เนื้อหา"
}

// Response
{
  "message": "Notifications sent",
  "results": [...],
  "validSubscriptionsCount": 1,
  "totalSubscriptions": 1
}
```

## 🔧 การจัดการ Subscription

### การเก็บข้อมูล
```typescript
// Development (Memory)
let subscriptions: PushSubscription[] = [];

// Production (Database)
interface Subscription {
  id: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userId?: string;
  createdAt: Date;
  lastUsed: Date;
}
```

### การตรวจสอบและลบ
```typescript
// ตรวจสอบ subscription ที่หมดอายุ
if (error.statusCode === 410) {
  // ลบออกจาก database
  await removeSubscription(subscription.id);
}
```

## 🐛 การแก้ไขปัญหา

### 1. Notification ไม่แสดง
- ตรวจสอบ Browser Permission
- ตรวจสอบ Service Worker Status
- ดู Console Logs

### 2. Subscription หมดอายุ
- ล้าง Browser Data
- ลงทะเบียนใหม่
- ตรวจสอบ VAPID Keys

### 3. API Error
- ตรวจสอบ VAPID Keys
- ตรวจสอบ Network Connection
- ดู Server Logs

### 4. Service Worker ไม่ทำงาน
```bash
# Hard Refresh
Ctrl + Shift + R

# หรือ Unregister ใน DevTools
F12 → Application → Service Workers → Unregister
```

## 🔒 ความปลอดภัย

### VAPID Keys
- **Public Key**: ใช้ใน Frontend (ปลอดภัย)
- **Private Key**: ใช้ใน Backend (เก็บเป็นความลับ)

### HTTPS
- **Development**: HTTP (localhost)
- **Production**: ต้องใช้ HTTPS

### Permission
- ผู้ใช้ต้องอนุญาต Notification
- สามารถยกเลิกได้ใน Browser Settings

## 📊 การ Monitor และ Logs

### Console Logs
```javascript
// Service Worker
console.log('Push event received!');
console.log('Notification shown successfully!');

// Backend
console.log('Sending notifications to', count, 'subscriptions');
console.log('Successfully sent to:', endpoint);
```

### Dashboard Metrics
- จำนวน Active Subscriptions
- ผลลัพธ์การส่งล่าสุด
- สถานะระบบ

## 🚀 การ Deploy

### Vercel
```bash
npm run build
vercel --prod
```

### Environment Variables
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_EMAIL=your_email@example.com
```

## 📝 License

MIT License

## 🤝 Contributing

1. Fork โปรเจค
2. สร้าง Feature Branch
3. Commit การเปลี่ยนแปลง
4. Push ไป Branch
5. สร้าง Pull Request

---

**หมายเหตุ**: ระบบนี้เหมาะสำหรับการทดสอบและเรียนรู้ สำหรับ Production ควรใช้ Database และเพิ่มระบบ Authentication
