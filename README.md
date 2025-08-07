# Push Notification System

ระบบแจ้งเตือนแบบ Real-time ที่ใช้ Web Push API และ Service Worker เพื่อส่งการแจ้งเตือนไปยังผู้ใช้แม้ว่าเว็บไซต์จะไม่ได้เปิดอยู่

## 📋 สารบัญ

- [ภาพรวมระบบ](#ภาพรวมระบบ)
- [สถาปัตยกรรมระบบ](#สถาปัตยกรรมระบบ)
- [การติดตั้ง](#การติดตั้ง)
- [การตั้งค่า](#การตั้งค่า)
- [โครงสร้างไฟล์](#โครงสร้างไฟล์)
- [การทำงานของระบบ](#การทำงานของระบบ)
- [API Endpoints](#api-endpoints)
- [การใช้งาน](#การใช้งาน)
- [ข้อจำกัด](#ข้อจำกัด)
- [การแก้ไขปัญหา](#การแก้ไขปัญหา)

## 🎯 ภาพรวมระบบ

ระบบนี้เป็น Web Application ที่ใช้ Next.js 13+ และ Web Push API เพื่อส่งการแจ้งเตือนแบบ Real-time ไปยังผู้ใช้ โดยมีคุณสมบัติหลัก:

- **Real-time Notifications**: ส่งการแจ้งเตือนทันทีเมื่อมีข้อมูลใหม่
- **Cross-platform**: ทำงานได้บนทุกอุปกรณ์และเบราว์เซอร์ที่รองรับ
- **Offline Support**: ส่งการแจ้งเตือนได้แม้ว่าเว็บไซต์จะไม่ได้เปิดอยู่
- **Dashboard Management**: จัดการและติดตามการแจ้งเตือนผ่าน Dashboard
- **Subscription Management**: จัดการ subscriptions ของผู้ใช้อัตโนมัติ

## 🏗️ สถาปัตยกรรมระบบ

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Service       │
│   (Next.js)     │◄──►│   (API Routes)  │◄──►│   Worker        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Browser       │    │   VAPID Keys    │    │   Push Service  │
│   Notifications │    │   (Web Push)    │    │   (Browser)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### องค์ประกอบหลัก:

1. **Frontend (Next.js)**: หน้าเว็บและ UI
2. **Backend (API Routes)**: จัดการ subscriptions และส่งการแจ้งเตือน
3. **Service Worker**: รับและแสดงการแจ้งเตือน
4. **VAPID Keys**: สำหรับยืนยันตัวตนกับ Push Service
5. **Push Service**: บริการของเบราว์เซอร์สำหรับส่งการแจ้งเตือน

## 🚀 การติดตั้ง

### เงื่อนไขเบื้องต้น

- Node.js 18+ 
- npm หรือ yarn
- เบราว์เซอร์ที่รองรับ Service Worker และ Push API
- HTTPS (จำเป็นสำหรับ Production)

### ขั้นตอนการติดตั้ง

1. **Clone โปรเจค**
```bash
git clone <repository-url>
cd pwa-noti
```

2. **ติดตั้ง Dependencies**
```bash
npm install
```

3. **สร้าง VAPID Keys**
```bash
node generateVapidKeys.js
```

4. **ตั้งค่า Environment Variables**
สร้างไฟล์ `.env.local`:
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
```

5. **รัน Development Server**
```bash
npm run dev
```

## ⚙️ การตั้งค่า

### VAPID Keys

VAPID (Voluntary Application Server Identification) Keys ใช้สำหรับยืนยันตัวตนกับ Push Service

```javascript
// generateVapidKeys.js
const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();
console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);
```

### Service Worker Registration

Service Worker จะถูกลงทะเบียนอัตโนมัติเมื่อเข้าหน้าเว็บ:

```javascript
// components/PushManager.tsx
const registration = await navigator.serviceWorker.register('/sw.js');
```

## 📁 โครงสร้างไฟล์

```
pwa-noti/
├── app/                          # Next.js 13+ App Router
│   ├── admin/                    # หน้า Admin (ถ้ามี)
│   ├── api/                      # API Routes
│   │   ├── save-subscription/    # จัดการ subscriptions
│   │   └── send-notification/    # ส่งการแจ้งเตือน
│   ├── dashboard/                # หน้า Dashboard
│   │   └── page.tsx             # หน้าจัดการการแจ้งเตือน
│   ├── favicon.ico              # ไอคอนเว็บไซต์
│   ├── globals.css              # Global CSS
│   ├── layout.tsx               # Root Layout
│   ├── lib/                     # Utility Functions
│   │   └── subscriptions.ts     # จัดการ subscriptions
│   └── page.tsx                 # หน้าแรก
├── components/                   # React Components
│   └── PushManager.tsx          # จัดการ Push Notifications
├── public/                      # Static Files
│   ├── sw.js                    # Service Worker
│   └── *.svg                    # Icons
├── generateVapidKeys.js         # สร้าง VAPID Keys
├── key.txt                      # เก็บ VAPID Keys
├── next.config.ts               # Next.js Configuration
├── package.json                 # Dependencies
└── README.md                    # เอกสารนี้
```

## 🔄 การทำงานของระบบ

### 1. การลงทะเบียน Service Worker

```javascript
// components/PushManager.tsx
useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        registerServiceWorkerAndSubscribe();
    }
}, []);
```

**ขั้นตอน:**
1. ตรวจสอบว่าเบราว์เซอร์รองรับ Service Worker และ Push API
2. ลงทะเบียน Service Worker (`/sw.js`)
3. ขอสิทธิ์การแจ้งเตือนจากผู้ใช้
4. สร้าง Push Subscription
5. ส่ง subscription ไปยัง backend

### 2. การจัดการ Subscriptions

```javascript
// app/lib/subscriptions.ts
export const addSubscription = (subscription: PushSubscription) => {
    const exists = subscriptions.findIndex(sub => sub.endpoint === subscription.endpoint) !== -1;
    if (!exists) {
        subscriptions.push(subscription);
    }
};
```

**ฟังก์ชัน:**
- `addSubscription()`: เพิ่ม subscription ใหม่
- `getSubscriptions()`: ดึงรายการ subscriptions ทั้งหมด
- `removeSubscription()`: ลบ subscription ตาม endpoint
- `clearSubscriptions()`: ลบ subscriptions ทั้งหมด

### 3. การส่งการแจ้งเตือน

```javascript
// app/api/send-notification/route.ts
export async function POST(request: NextRequest) {
    const { title, body } = await request.json();
    const subscriptions = getSubscriptions();
    
    const results = await Promise.allSettled(
        subscriptions.map(subscription =>
            webpush.sendNotification(subscription, JSON.stringify({ title, body }))
        )
    );
}
```

**ขั้นตอน:**
1. รับข้อมูลการแจ้งเตือน (title, body)
2. ดึงรายการ subscriptions ทั้งหมด
3. ส่งการแจ้งเตือนไปยังทุก subscription
4. ติดตามผลลัพธ์การส่ง

### 4. การแสดงการแจ้งเตือน

```javascript
// public/sw.js
self.addEventListener('push', function (event) {
    const data = event.data.json();
    const options = {
        body: data.body,
        icon: '/next.svg',
        requireInteraction: false,
        silent: false,
        vibrate: [100, 50, 100],
        priority: 'high'
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});
```

**ขั้นตอน:**
1. รับ push event จาก Push Service
2. Parse ข้อมูลการแจ้งเตือน
3. แสดงการแจ้งเตือนด้วย `showNotification()`
4. ตั้งเวลาปิดอัตโนมัติ

## 🔌 API Endpoints

### POST /api/save-subscription

**หน้าที่:** บันทึก subscription ของผู้ใช้

**Request Body:**
```json
{
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
        "p256dh": "...",
        "auth": "..."
    }
}
```

**Response:**
```json
{
    "message": "Subscription saved.",
    "totalSubscriptions": 1
}
```

### GET /api/save-subscription

**หน้าที่:** ดึงรายการ subscriptions ทั้งหมด

**Response:**
```json
{
    "subscriptions": [...],
    "count": 1,
    "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### DELETE /api/save-subscription

**หน้าที่:** ลบ subscriptions ทั้งหมด (สำหรับการทดสอบ)

**Response:**
```json
{
    "message": "All subscriptions cleared.",
    "previousCount": 1
}
```

### POST /api/send-notification

**หน้าที่:** ส่งการแจ้งเตือนไปยังผู้ใช้ทั้งหมด

**Request Body:**
```json
{
    "title": "หัวข้อการแจ้งเตือน",
    "body": "เนื้อหาการแจ้งเตือน"
}
```

**Response:**
```json
{
    "validSubscriptionsCount": 1,
    "totalSubscriptions": 1,
    "results": [...]
}
```

## 💻 การใช้งาน

### สำหรับผู้ใช้ทั่วไป

1. **เปิดเว็บไซต์** - เข้าไปที่หน้าแรก
2. **อนุญาตการแจ้งเตือน** - เมื่อเบราว์เซอร์ถาม ให้กด "อนุญาต"
3. **รับการแจ้งเตือน** - ระบบจะส่งการแจ้งเตือนเมื่อมีข้อมูลใหม่

### สำหรับผู้ดูแลระบบ

1. **เข้าหน้า Dashboard** - ไปที่ `/dashboard`
2. **ดูสถานะ** - ตรวจสอบจำนวน subscriptions และสถานะการทำงาน
3. **ส่งการแจ้งเตือน** - กรอกหัวข้อและเนื้อหา แล้วกดส่ง
4. **ติดตามผล** - ดูประวัติการส่งและผลลัพธ์

### การส่งการแจ้งเตือนแบบ Programmatic

```javascript
// ส่งการแจ้งเตือนผ่าน API
const response = await fetch('/api/send-notification', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        title: 'หัวข้อ',
        body: 'เนื้อหา'
    })
});

const result = await response.json();
console.log('ผลลัพธ์:', result);
```

## ⚠️ ข้อจำกัด

### ข้อจำกัดทางเทคนิค

1. **HTTPS Required**: ต้องใช้ HTTPS ใน Production
2. **Browser Support**: ต้องใช้เบราว์เซอร์ที่รองรับ Service Worker และ Push API
3. **User Permission**: ผู้ใช้ต้องอนุญาตการแจ้งเตือน
4. **Notification Limits**: ระบบปฏิบัติการจำกัดจำนวนการแจ้งเตือนที่แสดงพร้อมกัน

### ข้อจำกัดของระบบ

1. **In-Memory Storage**: Subscriptions เก็บใน memory (หายเมื่อ restart server)
2. **No Database**: ไม่มีฐานข้อมูลสำหรับเก็บข้อมูลถาวร
3. **Single Server**: ไม่รองรับ multiple servers
4. **No Authentication**: ไม่มีระบบยืนยันตัวตน

### ข้อจำกัดของการแจ้งเตือน

1. **Stacking**: การแจ้งเตือนอาจไม่ซ้อนกันได้ตามที่ต้องการ
2. **Auto-close**: การแจ้งเตือนหายไปอัตโนมัติหลังจาก 3 วินาที
3. **Platform Differences**: การแสดงผลแตกต่างกันในแต่ละระบบปฏิบัติการ

## 🔧 การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

#### 1. การแจ้งเตือนไม่ทำงาน

**สาเหตุ:** ไม่ได้อนุญาตการแจ้งเตือน
**วิธีแก้:**
- ตรวจสอบการตั้งค่าการแจ้งเตือนในเบราว์เซอร์
- ลองรีเซ็ทการตั้งค่าและอนุญาตใหม่

#### 2. Service Worker ไม่ลงทะเบียน

**สาเหตุ:** ไม่รองรับ Service Worker
**วิธีแก้:**
- ใช้เบราว์เซอร์ที่รองรับ (Chrome, Firefox, Safari, Edge)
- ตรวจสอบว่าใช้ HTTPS

#### 3. VAPID Keys ไม่ถูกต้อง

**สาเหตุ:** Keys ไม่ตรงกันหรือหมดอายุ
**วิธีแก้:**
- สร้าง VAPID Keys ใหม่
- อัปเดต environment variables

#### 4. การแจ้งเตือนไม่ซ้อนกัน

**สาเหตุ:** ข้อจำกัดของระบบปฏิบัติการ
**วิธีแก้:**
- ปรับการตั้งค่าใน Service Worker
- ลองใช้ tag เดียวกันหรือไม่ใช้ tag

### การ Debug

#### 1. ตรวจสอบ Console

```javascript
// เปิด Developer Tools และดู Console
// ควรเห็น log ต่างๆ เช่น:
// "Service Worker loading..."
// "Push event received!"
// "Notification shown successfully"
```

#### 2. ตรวจสอบ Network

```javascript
// ดู Network tab ใน Developer Tools
// ตรวจสอบ API calls ไปยัง:
// - /api/save-subscription
// - /api/send-notification
```

#### 3. ตรวจสอบ Application

```javascript
// ไปที่ Application tab ใน Developer Tools
// ตรวจสอบ:
// - Service Workers
// - Storage (Local Storage, Session Storage)
```

## 🚀 การพัฒนาเพิ่มเติม

### ฟีเจอร์ที่แนะนำ

1. **Database Integration**: เพิ่มฐานข้อมูลสำหรับเก็บ subscriptions
2. **User Authentication**: เพิ่มระบบยืนยันตัวตน
3. **Notification Templates**: เพิ่มเทมเพลตการแจ้งเตือน
4. **Analytics**: เพิ่มการติดตามสถิติการแจ้งเตือน
5. **Scheduled Notifications**: เพิ่มการแจ้งเตือนตามเวลา

### การปรับปรุงประสิทธิภาพ

1. **Caching**: เพิ่มการ cache สำหรับ subscriptions
2. **Batch Processing**: ส่งการแจ้งเตือนเป็นชุด
3. **Error Handling**: ปรับปรุงการจัดการ error
4. **Monitoring**: เพิ่มการติดตามสถานะระบบ

## 📄 License

MIT License - ดูรายละเอียดในไฟล์ LICENSE

## 🤝 Contributing

1. Fork โปรเจค
2. สร้าง feature branch
3. Commit การเปลี่ยนแปลง
4. Push ไปยัง branch
5. สร้าง Pull Request

## 📞 Support

หากมีปัญหาหรือคำถาม สามารถติดต่อได้ผ่าน:
- GitHub Issues
- Email: [your-email@example.com]

---

**หมายเหตุ:** ระบบนี้เป็นตัวอย่างสำหรับการเรียนรู้ Web Push API และ Service Worker การใช้งานจริงควรมีการปรับปรุงเพิ่มเติมตามความต้องการ
