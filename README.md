# Push Notification System

ระบบแจ้งเตือนแบบ Real-time ที่ใช้ Web Push API และ Service Worker

## 📋 สารบัญ

- [การติดตั้ง](#การติดตั้ง)
- [โครงสร้างไฟล์](#โครงสร้างไฟล์)
- [Flow การทำงาน](#flow-การทำงาน)
- [การใช้งาน](#การใช้งาน)
- [การปรับแต่ง](#การปรับแต่ง)
- [ข้อจำกัด](#ข้อจำกัด)
- [การแก้ไขปัญหา](#การแก้ไขปัญหา)

## 🚀 การติดตั้ง

### เงื่อนไขเบื้องต้น
- Node.js 18+
- HTTPS (จำเป็นสำหรับ Production)

### ขั้นตอนการติดตั้ง

1. **Clone และติดตั้ง**
```bash
git clone <repository-url>
cd pwa-noti
npm install
```

2. **สร้าง VAPID Keys**
```bash
node generateVapidKeys.js
```

3. **ตั้งค่า Environment Variables**
สร้างไฟล์ `.env.local`:
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
```

4. **รันโปรเจค**
```bash
npm run dev
```

## 📁 โครงสร้างไฟล์

### Frontend Files
```
app/
├── page.tsx                    # หน้าแรก - แสดงสถานะการแจ้งเตือน
├── dashboard/page.tsx          # Dashboard - จัดการและส่งการแจ้งเตือน
├── layout.tsx                  # Root Layout - รวม PushManager
├── globals.css                 # Global CSS
└── favicon.ico                 # ไอคอนเว็บไซต์

components/
└── PushManager.tsx             # จัดการ Push Notifications (ทำงานในพื้นหลัง)

public/
├── sw.js                       # Service Worker - รับและแสดงการแจ้งเตือน
└── *.svg                       # ไอคอนต่างๆ
```

### Backend Files
```
app/
├── api/
│   ├── save-subscription/
│   │   └── route.ts            # API จัดการ subscriptions (GET, POST, DELETE)
│   └── send-notification/
│       └── route.ts            # API ส่งการแจ้งเตือน (POST)
└── lib/
    └── subscriptions.ts        # ฟังก์ชันจัดการ subscriptions ใน memory

generateVapidKeys.js            # สคริปต์สร้าง VAPID Keys
key.txt                         # ไฟล์เก็บ VAPID Keys
```

## 🔄 Flow การทำงาน

### 📋 ภาพรวม Flow ทั้งหมด

```
1. เริ่มต้นระบบ → 2. ขอสิทธิ์ → 3. ลงทะเบียน Service Worker → 4. สร้าง Subscription → 5. เก็บใน Backend
                                                                                           ↓
8. ผู้ใช้คลิกการแจ้งเตือน ← 7. แสดงการแจ้งเตือน ← 6. ส่งการแจ้งเตือนจาก Dashboard
```

---

### 🔧 1. การเริ่มต้นระบบ (Initialization)

#### ขั้นตอนที่ 1: โหลดหน้าเว็บ
**ไฟล์:** `app/layout.tsx` (บรรทัด 1-25)
```typescript
<body className={inter.className}>
    <PushManager />
    {children}
</body>
```
**ทำอะไร:** รวม PushManager component ในทุกหน้าเพื่อให้ระบบทำงานอัตโนมัติ

#### ขั้นตอนที่ 2: ตรวจสอบความสามารถของเบราว์เซอร์
**ไฟล์:** `components/PushManager.tsx` (บรรทัด 25-35)
```typescript
useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window && !hasInitialized.current) {
        hasInitialized.current = true;
        initializePushManager().catch(console.error);
    } else if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push messaging is not supported');
    }
}, []);
```
**ทำอะไร:** 
- ตรวจสอบว่าเบราว์เซอร์รองรับ Service Worker และ Push API
- ป้องกันการเริ่มต้นซ้ำด้วย `hasInitialized.current`
- แสดง warning ถ้าเบราว์เซอร์ไม่รองรับ

#### ขั้นตอนที่ 3: เริ่มต้นระบบ Push Manager
**ไฟล์:** `components/PushManager.tsx` (บรรทัด 37-60)
```typescript
async function initializePushManager() {
    if (isProcessing.current) return;
    isProcessing.current = true;

    try {
        console.log('🚀 Initializing Push Manager...');
        
        // 1. ลงทะเบียน Service Worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registered');

        // 2. ตรวจสอบสิทธิ์ Notification
        await handleNotificationPermission();

        // 3. จัดการ subscription
        await handleSubscription(registration);

    } catch (error) {
        console.error('❌ Error in initializePushManager:', error);
    } finally {
        isProcessing.current = false;
    }
}
```
**ทำอะไร:**
- ป้องกันการประมวลผลซ้ำด้วย `isProcessing.current`
- ลงทะเบียน Service Worker เพื่อรับการแจ้งเตือน
- ขอสิทธิ์การแจ้งเตือนจากผู้ใช้
- จัดการ subscription สำหรับการแจ้งเตือน

---

### 🔔 2. การขอสิทธิ์การแจ้งเตือน (Permission Request)

#### ขั้นตอนที่ 4: ตรวจสอบและขอสิทธิ์
**ไฟล์:** `components/PushManager.tsx` (บรรทัด 62-80)
```typescript
async function handleNotificationPermission() {
    const currentPermission = Notification.permission;
    setPermission(currentPermission);

    if (currentPermission === 'default') {
        console.log('🔔 Requesting notification permission...');
        const newPermission = await Notification.requestPermission();
        setPermission(newPermission);
        
        if (newPermission !== 'granted') {
            throw new Error('Notification permission denied');
        }
        console.log('✅ Notification permission granted');
    } else if (currentPermission !== 'granted') {
        throw new Error('Notification permission denied');
    } else {
        console.log('✅ Notification permission already granted');
    }
}
```
**ทำอะไร:**
- ตรวจสอบสิทธิ์การแจ้งเตือนปัจจุบัน
- ถ้าเป็น `default` → ขอสิทธิ์จากผู้ใช้
- ถ้าเป็น `denied` → แสดง error
- ถ้าเป็น `granted` → ดำเนินการต่อ

---

### 🔧 3. การลงทะเบียน Service Worker

#### ขั้นตอนที่ 5: ลงทะเบียน Service Worker
**ไฟล์:** `components/PushManager.tsx` (บรรทัด 45-47)
```typescript
const registration = await navigator.serviceWorker.register('/sw.js');
console.log('✅ Service Worker registered');
```
**ทำอะไร:**
- ลงทะเบียน Service Worker จากไฟล์ `public/sw.js`
- Service Worker จะทำงานในพื้นหลังเพื่อรับการแจ้งเตือน

#### ขั้นตอนที่ 6: Service Worker ติดตั้งและเปิดใช้งาน
**ไฟล์:** `public/sw.js` (บรรทัด 3-12)
```javascript
self.addEventListener('install', function(event) {
    console.log('Service Worker installing...');
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    console.log('Service Worker activating...');
    event.waitUntil(self.clients.claim());
});
```
**ทำอะไร:**
- `install` event: ติดตั้ง Service Worker
- `skipWaiting()`: ทำให้ Service Worker ใหม่ทำงานทันที
- `activate` event: เปิดใช้งาน Service Worker
- `clients.claim()`: ควบคุมทุกหน้าเว็บที่เปิดอยู่

---

### 📱 4. การจัดการ Subscription

#### ขั้นตอนที่ 7: ตรวจสอบ Subscription ที่มีอยู่
**ไฟล์:** `components/PushManager.tsx` (บรรทัด 82-110)
```typescript
async function handleSubscription(registration: ServiceWorkerRegistration) {
    try {
        // ตรวจสอบ subscription ที่มีอยู่
        const existingSubscription = await registration.pushManager.getSubscription();
        
        if (existingSubscription) {
            console.log('📱 Found existing subscription');
            setSubscription(existingSubscription);
            
            // ตรวจสอบว่า subscription นี้ยังใช้งานได้หรือไม่
            const isValid = await validateSubscription(existingSubscription);
            if (isValid) {
                console.log('✅ Existing subscription is valid');
                await saveSubscriptionToBackend(existingSubscription);
                return;
            } else {
                console.log('⚠️ Existing subscription is invalid, removing...');
                await existingSubscription.unsubscribe();
            }
        }

        // สร้าง subscription ใหม่
        console.log('🆕 Creating new subscription...');
        const newSubscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
        });
        
        setSubscription(newSubscription);
        await saveSubscriptionToBackend(newSubscription);
        console.log('✅ New subscription created and saved');
        
    } catch (error) {
        console.error('❌ Error handling subscription:', error);
    }
}
```
**ทำอะไร:**
- ตรวจสอบว่ามี subscription อยู่แล้วหรือไม่
- ถ้ามี → ตรวจสอบความถูกต้อง
- ถ้าถูกต้อง → ใช้ subscription เดิม
- ถ้าไม่ถูกต้อง → ลบและสร้างใหม่
- ถ้าไม่มี → สร้าง subscription ใหม่

#### ขั้นตอนที่ 8: สร้าง Subscription ใหม่
**ไฟล์:** `components/PushManager.tsx` (บรรทัด 100-105)
```typescript
const newSubscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
});
```
**ทำอะไร:**
- `userVisibleOnly: true` → การแจ้งเตือนต้องแสดงให้ผู้ใช้เห็นเท่านั้น
- `applicationServerKey` → ใช้ VAPID public key เพื่อยืนยันตัวตน
- สร้าง subscription ที่เชื่อมต่อกับ Push Service ของเบราว์เซอร์

#### ขั้นตอนที่ 9: ตรวจสอบความถูกต้องของ Subscription
**ไฟล์:** `components/PushManager.tsx` (บรรทัด 117-135)
```typescript
async function validateSubscription(subscription: PushSubscription): Promise<boolean> {
    try {
        // ตรวจสอบว่า subscription ยังใช้งานได้หรือไม่
        const response = await fetch('/api/save-subscription', {
            method: 'POST',
            body: JSON.stringify(subscription),
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            return true;
        } else {
            console.log('Subscription validation failed:', response.status);
            return false;
        }
    } catch (error) {
        console.error('Error validating subscription:', error);
        return false;
    }
}
```
**ทำอะไร:**
- ส่ง subscription ไปยัง backend เพื่อทดสอบ
- ถ้า backend รับได้ → subscription ยังใช้งานได้
- ถ้า backend รับไม่ได้ → subscription หมดอายุหรือมีปัญหา

---

### 💾 5. การเก็บ Subscription ใน Backend

#### ขั้นตอนที่ 10: ส่ง Subscription ไป Backend
**ไฟล์:** `components/PushManager.tsx` (บรรทัด 136-150)
```typescript
async function saveSubscriptionToBackend(subscription: PushSubscription) {
    try {
        const response = await fetch('/api/save-subscription', {
            method: 'POST',
            body: JSON.stringify(subscription),
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Subscription saved to backend:', result.message);
        } else {
            console.error('❌ Failed to save subscription:', response.status);
        }
    } catch (error) {
        console.error('❌ Error saving subscription:', error);
    }
}
```
**ทำอะไร:**
- ส่ง subscription ไปยัง API endpoint `/api/save-subscription`
- ใช้ POST method พร้อม JSON body
- ตรวจสอบผลลัพธ์และแสดง log

#### ขั้นตอนที่ 11: Backend รับและเก็บ Subscription
**ไฟล์:** `app/api/save-subscription/route.ts` (บรรทัด 5-25)
```typescript
export async function POST(request: NextRequest) {
    const subscription = await request.json();
    
    // ลบ subscription เก่าที่มี endpoint เดียวกัน
    removeSubscription(subscription.endpoint);
    
    // เพิ่ม subscription ใหม่
    addSubscription(subscription);
    
    return NextResponse.json({ 
        message: 'Subscription saved.',
        totalSubscriptions: getSubscriptionCount()
    });
}
```
**ทำอะไร:**
- รับ subscription จาก frontend
- ลบ subscription เก่าที่มี endpoint เดียวกัน (ป้องกันซ้ำ)
- เพิ่ม subscription ใหม่
- ส่งผลลัพธ์กลับไปพร้อมจำนวน subscriptions ทั้งหมด

#### ขั้นตอนที่ 12: เก็บใน Memory Storage
**ไฟล์:** `app/lib/subscriptions.ts` (บรรทัด 5-12)
```typescript
export const addSubscription = (subscription: PushSubscription) => {
    const exists = subscriptions.findIndex(sub => sub.endpoint === subscription.endpoint) !== -1;
    if (!exists) {
        subscriptions.push(subscription);
        console.log('New subscription saved:', subscription.endpoint.substring(0, 50) + '...');
    }
};
```
**ทำอะไร:**
- ตรวจสอบว่า subscription นี้มีอยู่แล้วหรือไม่
- ถ้าไม่มี → เพิ่มเข้า array ใน memory
- บันทึก log เพื่อติดตาม
- **หมายเหตุ:** เก็บใน memory เท่านั้น หายเมื่อ restart server

---

### 📤 6. การส่งการแจ้งเตือน

#### ขั้นตอนที่ 13: ผู้ใช้ส่งการแจ้งเตือนจาก Dashboard
**ไฟล์:** `app/dashboard/page.tsx` (บรรทัด 60-80)
```typescript
const sendNotification = async () => {
    const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title: notificationTitle,
            body: notificationBody
        })
    });
};
```
**ทำอะไร:** 
- ผู้ใช้กรอกหัวข้อและเนื้อหาใน dashboard
- กดปุ่มส่ง → ส่งข้อมูลไปยัง API endpoint `/api/send-notification`
- ใช้ POST method พร้อม JSON body

#### ขั้นตอนที่ 14: Backend รับและประมวลผล
**ไฟล์:** `app/api/send-notification/route.ts` (บรรทัด 15-25)
```typescript
export async function POST(request: NextRequest) {
    const { title, body } = await request.json();

    const payload = JSON.stringify({ title, body });
    const subscriptions = getSubscriptions();

    console.log('Sending notifications to', subscriptions.length, 'subscriptions');
```
**ทำอะไร:**
- รับข้อมูลการแจ้งเตือน (title, body) จาก frontend
- สร้าง payload เป็น JSON string
- ดึงรายการ subscriptions ทั้งหมดจาก memory

#### ขั้นตอนที่ 15: ส่งการแจ้งเตือนไปยังทุก Subscription
**ไฟล์:** `app/api/send-notification/route.ts` (บรรทัด 27-50)
```typescript
for (const sub of subscriptions) {
    try {
        await webpush.sendNotification(sub as any, payload);
        sendResults.push({ status: 'success', subscription: sub });
        validSubscriptions.push(sub);
        console.log('Successfully sent to:', sub.endpoint);
    } catch (error: unknown) {
        console.error('Error sending notification:', error);
        const errorObj = error as { name?: string; message?: string; statusCode?: number; body?: string };
        sendResults.push({ 
            status: 'fail', 
            error: {
                name: errorObj.name || 'Unknown',
                message: errorObj.message || 'Unknown error',
                statusCode: errorObj.statusCode || 0,
                body: errorObj.body || ''
            },
            subscription: sub
        });
        
        if (errorObj.statusCode === 410) {
            console.log('Removing expired subscription:', sub.endpoint);
        }
    }
}
```
**ทำอะไร:**
- วนลูปส่งการแจ้งเตือนไปยังทุก subscription
- ใช้ `webpush.sendNotification()` เพื่อส่งผ่าน Push Service
- บันทึกผลลัพธ์ (สำเร็จ/ล้มเหลว)
- ถ้า status code เป็น 410 → subscription หมดอายุ
- เก็บ subscription ที่ใช้งานได้ไว้

#### ขั้นตอนที่ 16: อัปเดต Subscriptions
**ไฟล์:** `app/api/send-notification/route.ts` (บรรทัด 52-58)
```typescript
// อัปเดต subscriptions array ให้เหลือแค่ตัวที่ใช้งานได้
updateSubscriptions(validSubscriptions);

return NextResponse.json({ 
    message: 'Notifications sent', 
    results: sendResults,
    validSubscriptionsCount: validSubscriptions.length,
    totalSubscriptions: validSubscriptions.length
});
```
**ทำอะไร:**
- ลบ subscriptions ที่หมดอายุออกจาก memory
- ส่งผลลัพธ์กลับไปยัง frontend
- รวมข้อมูลจำนวน subscriptions ที่ใช้งานได้

---

### 📱 7. การรับและแสดงการแจ้งเตือน

#### ขั้นตอนที่ 17: Service Worker รับ Push Event
**ไฟล์:** `public/sw.js` (บรรทัด 14-35)
```javascript
self.addEventListener('push', function (event) {
    console.log('Push event received!');
    
    let data = { title: 'Notification', body: 'You have a new notification' };
    
    if (event.data) {
        try {
            // ลอง parse เป็น JSON ก่อน
            data = event.data.json();
            console.log('Push data (JSON):', data);
        } catch (e) {
            // ถ้าไม่ใช่ JSON ให้ใช้เป็น plain text
            try {
                const text = event.data.text();
                console.log('Push data (text):', text);
                data = { title: 'Notification', body: text };
            } catch (e2) {
                console.error('Error parsing push data:', e2);
                data = { title: 'Notification', body: 'You have a new notification' };
            }
        }
    }
```
**ทำอะไร:**
- รับ push event จาก Push Service ของเบราว์เซอร์
- Parse ข้อมูลการแจ้งเตือนจาก JSON
- ถ้า parse ไม่ได้ → ใช้เป็น plain text
- ตั้งค่า default ถ้าไม่มีข้อมูล

#### ขั้นตอนที่ 18: ตั้งค่าการแสดงการแจ้งเตือน
**ไฟล์:** `public/sw.js` (บรรทัด 37-50)
```javascript
const options = {
    body: data.body,
    icon: '/next.svg',
    badge: '/next.svg',
    requireInteraction: false,
    silent: false,
    vibrate: [100, 50, 100],
    priority: 'high',
    actions: [
        {
            action: 'view',
            title: 'ดู'
        }
    ],
};
```
**ทำอะไร:**
- ตั้งค่าการแสดงผลการแจ้งเตือน
- `body`: เนื้อหาการแจ้งเตือน
- `icon`: ไอคอนการแจ้งเตือน
- `badge`: ไอคอนเล็กในแถบงาน
- `requireInteraction: false`: ไม่ต้องรอผู้ใช้โต้ตอบ
- `silent: false`: มีเสียง
- `vibrate`: รูปแบบการสั่น
- `priority: 'high'`: ความสำคัญสูง
- `actions`: ปุ่มที่แสดงในการแจ้งเตือน

#### ขั้นตอนที่ 19: แสดงการแจ้งเตือน
**ไฟล์:** `public/sw.js` (บรรทัด 52-75)
```javascript
console.log('📱 Showing notification:', data.title, 'body:', data.body);

// แสดงการแจ้งเตือนทันทีโดยไม่รอ
event.waitUntil(
    self.registration.showNotification(data.title, options)
        .then(() => {
            console.log('✅ Notification shown successfully');
            
            // ตั้งเวลาปิดการแจ้งเตือนอัตโนมัติหลังจาก 3 วินาที
            setTimeout(() => {
                self.registration.getNotifications().then(notifications => {
                    notifications.forEach(notification => {
                        if (notification.body === data.body) {
                            notification.close();
                            console.log('🔄 Notification auto-closed after 3 seconds');
                        }
                    });
                });
            }, 3000);
        })
        .catch((error) => {
            console.error('❌ Error showing notification:', error);
        })
);
```
**ทำอะไร:**
- แสดงการแจ้งเตือนด้วย `showNotification()`
- ใช้ `event.waitUntil()` เพื่อรอให้การแจ้งเตือนแสดงเสร็จ
- ตั้งเวลาปิดการแจ้งเตือนอัตโนมัติหลังจาก 3 วินาที
- ค้นหาและปิดการแจ้งเตือนที่ตรงกัน
- บันทึก log เพื่อติดตาม

---

### 🖱️ 8. การจัดการ Click Event

#### ขั้นตอนที่ 20: ผู้ใช้คลิกการแจ้งเตือน
**ไฟล์:** `public/sw.js` (บรรทัด 77-90)
```javascript
self.addEventListener('notificationclick', function (event) {
    console.log('🖱️ Notification clicked:', event.notification.body, 'action:', event.action);
    
    // ปิดการแจ้งเตือนทันทีเมื่อคลิก
    event.notification.close();
    
    // เปิดหน้า dashboard เมื่อคลิก
    event.waitUntil(
        clients.openWindow('/dashboard')
    );
});
```
**ทำอะไร:**
- รับ event เมื่อผู้ใช้คลิกการแจ้งเตือน
- ปิดการแจ้งเตือนทันที
- เปิดหน้า dashboard ในแท็บใหม่
- บันทึก log เพื่อติดตาม

#### ขั้นตอนที่ 21: การปิดการแจ้งเตือน
**ไฟล์:** `public/sw.js` (บรรทัด 92-94)
```javascript
self.addEventListener('notificationclose', function (event) {
    console.log('🚪 Notification closed:', event.notification.body);
});
```
**ทำอะไร:**
- รับ event เมื่อการแจ้งเตือนถูกปิด
- บันทึก log เพื่อติดตาม

---

### 📊 สรุป Flow การทำงาน

| ขั้นตอน | ไฟล์ | การทำงาน | ผลลัพธ์ |
|---------|------|----------|---------|
| 1 | `layout.tsx` | โหลด PushManager | เริ่มต้นระบบ |
| 2 | `PushManager.tsx` | ตรวจสอบความสามารถเบราว์เซอร์ | ตรวจสอบการรองรับ |
| 3 | `PushManager.tsx` | ลงทะเบียน Service Worker | Service Worker พร้อมใช้งาน |
| 4 | `PushManager.tsx` | ขอสิทธิ์การแจ้งเตือน | ได้สิทธิ์จากผู้ใช้ |
| 5 | `PushManager.tsx` | สร้าง/ตรวจสอบ Subscription | Subscription พร้อมใช้งาน |
| 6 | `save-subscription/route.ts` | เก็บ Subscription ใน Backend | เก็บใน Memory |
| 7 | `dashboard/page.tsx` | ผู้ใช้ส่งการแจ้งเตือน | ส่งข้อมูลไป Backend |
| 8 | `send-notification/route.ts` | ส่งการแจ้งเตือนไปทุก Subscription | ส่งผ่าน Push Service |
| 9 | `sw.js` | รับ Push Event | แสดงการแจ้งเตือน |
| 10 | `sw.js` | ผู้ใช้คลิกการแจ้งเตือน | เปิดหน้า Dashboard |

---

## 💻 การใช้งาน

### สำหรับผู้ใช้
1. เปิดเว็บไซต์ → อนุญาตการแจ้งเตือน
2. ระบบจะลงทะเบียน Service Worker และสร้าง subscription อัตโนมัติ

### สำหรับผู้ดูแล
1. เข้า `/dashboard`
2. ดูจำนวน subscriptions และสถานะ
3. กรอกหัวข้อและเนื้อหา → กดส่ง
4. ดูประวัติการส่งและผลลัพธ์

### API Usage
```javascript
// ส่งการแจ้งเตือน
const response = await fetch('/api/send-notification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        title: 'หัวข้อ',
        body: 'เนื้อหา'
    })
});
```

## ⚙️ การปรับแต่ง

### 1. การแจ้งเตือน (public/sw.js)

**เวลาปิดอัตโนมัติ**
```javascript
// บรรทัด 67-75: เปลี่ยนจาก 3000 เป็นค่าที่ต้องการ (มิลลิวินาที)
setTimeout(() => {
    // ปิดการแจ้งเตือน
}, 3000); // ปรับแต่งได้
```

**การสั่น**
```javascript
// บรรทัด 43: เปลี่ยนรูปแบบการสั่น
vibrate: [100, 50, 100], // ปรับแต่งได้
```

**ไอคอน**
```javascript
// บรรทัด 41-42: เปลี่ยนไอคอน
icon: '/next.svg',
badge: '/next.svg',
```

### 2. การตรวจสอบสถานะ (app/page.tsx)

**ความถี่ในการอัปเดต**
```javascript
// บรรทัด 35: เปลี่ยนจาก 3000 เป็นค่าที่ต้องการ
const interval = setInterval(() => {
    checkNotificationStatus();
    loadSubscriptionCount();
}, 3000); // ปรับแต่งได้
```

### 3. การจัดการ Subscriptions (app/lib/subscriptions.ts)

**การตรวจสอบซ้ำ**
```javascript
// บรรทัด 6: เปลี่ยนวิธีการตรวจสอบ subscription ซ้ำ
const exists = subscriptions.findIndex(sub => sub.endpoint === subscription.endpoint) !== -1;
```

### 4. การส่งการแจ้งเตือน (app/api/send-notification/route.ts)

**การจัดการ Error**
```javascript
// บรรทัด 15-25: ปรับแต่งการจัดการ error และ retry logic
if (result.status === 'rejected') {
    // จัดการ error
}
```

## ⚠️ ข้อจำกัด

### 1. ข้อจำกัดทางเทคนิค

**HTTPS Required**
- Development: HTTP (localhost) ได้
- Production: ต้องใช้ HTTPS เท่านั้น
- อ้างอิง: [MDN Web Docs - Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API#security) (2024)

**Browser Support**
- ✅ Chrome 42+ (2015)
- ✅ Firefox 44+ (2016)
- ✅ Safari 16+ (2022)
- ✅ Edge 17+ (2017)
- ❌ Internet Explorer (ไม่รองรับ)
- อ้างอิง: [Can I Use - Service Workers](https://caniuse.com/serviceworkers) (2024)

**Push API Support**
- ✅ Chrome 42+ (2015)
- ✅ Firefox 44+ (2016)
- ✅ Safari 16+ (2022)
- ✅ Edge 17+ (2017)
- ❌ Internet Explorer (ไม่รองรับ)
- อ้างอิง: [Can I Use - Push API](https://caniuse.com/push-api) (2024)

### 2. ข้อจำกัดของระบบ

**In-Memory Storage**
- Subscriptions เก็บใน memory เท่านั้น
- หายเมื่อ restart server
- ไม่มี persistence

**Single Server**
- ไม่รองรับ multiple servers
- ไม่มี load balancing

**No Authentication**
- ไม่มีระบบยืนยันตัวตน
- ไม่มี user management

### 3. ข้อจำกัดของการแจ้งเตือน

**Notification Stacking**
- ระบบปฏิบัติการจำกัดจำนวนการแจ้งเตือนที่แสดงพร้อมกัน
- Windows: ~3-5 notifications
- macOS: ~3 notifications
- Linux: ขึ้นอยู่กับ Desktop Environment
- อ้างอิง: [Web Push Protocol](https://tools.ietf.org/html/rfc8030) (2016)

**Platform Differences**
- การแสดงผลแตกต่างกันในแต่ละ OS
- การจัดการ click events แตกต่างกัน
- อ้างอิง: [MDN - Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API) (2024)

**User Permission**
- ผู้ใช้ต้องอนุญาตการแจ้งเตือน
- สามารถยกเลิกได้ใน browser settings
- ไม่สามารถบังคับให้อนุญาตได้

### 4. ข้อจำกัดของ VAPID

**Key Management**
- VAPID keys ต้องตรงกันระหว่าง frontend และ backend
- Private key ต้องเก็บเป็นความลับ
- อ้างอิง: [RFC 8292 - Voluntary Application Server Identification](https://tools.ietf.org/html/rfc8292) (2018)

## 🔧 การแก้ไขปัญหา

### ปัญหาที่พบบ่อย

**1. การแจ้งเตือนไม่ทำงาน**
- ตรวจสอบ browser permission
- ตรวจสอบ HTTPS (production)
- ดู console logs

**2. Service Worker ไม่ลงทะเบียน**
- ใช้ browser ที่รองรับ
- ตรวจสอบ HTTPS
- Hard refresh (Ctrl+Shift+R)

**3. VAPID Keys ไม่ถูกต้อง**
- สร้าง keys ใหม่
- อัปเดต environment variables
- ตรวจสอบ key format

**4. การแจ้งเตือนไม่ซ้อนกัน**
- ข้อจำกัดของระบบปฏิบัติการ
- ลองปรับการตั้งค่าใน sw.js
- ใช้การแจ้งเตือนแบบรวม

### Debug Steps

1. **เปิด Developer Tools** → Console
2. **ตรวจสอบ Network** → API calls
3. **ตรวจสอบ Application** → Service Workers

## 📄 License

MIT License

---

**หมายเหตุ:** ระบบนี้เหมาะสำหรับการเรียนรู้และทดสอบ สำหรับ production ควรเพิ่ม database, authentication และ error handling ที่ครอบคลุม
