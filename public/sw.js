// Service Worker for Push Notifications
console.log('Service Worker loading...');

self.addEventListener('install', function(event) {
    console.log('Service Worker installing...');
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    console.log('Service Worker activating...');
    event.waitUntil(self.clients.claim());
});

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
});

self.addEventListener('notificationclick', function (event) {
    console.log('🖱️ Notification clicked:', event.notification.body, 'action:', event.action);
    
    // ปิดการแจ้งเตือนทันทีเมื่อคลิก
    event.notification.close();
    
    // เปิดหน้า dashboard เมื่อคลิก
    event.waitUntil(
        clients.openWindow('/dashboard')
    );
});

self.addEventListener('notificationclose', function (event) {
    console.log('🚪 Notification closed:', event.notification.body);
});
