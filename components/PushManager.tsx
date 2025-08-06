'use client'

import { useEffect, useState } from 'react';

const publicVapidKey = 'BDhju72ngefCEVdFFPC1-qpzNgDV7U8N-ENII-P6K8iMp_LfnCs38Z5AvMwqs6f9i_BVXEInw2RmmyXdK2_QtZ4'; // เอามาจากข้อ 2

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function PushManager() {
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            registerServiceWorkerAndSubscribe().catch(console.error);
        } else {
            console.warn('Push messaging is not supported');
        }
    }, []);

    async function registerServiceWorkerAndSubscribe() {
        // 1. ลงทะเบียน Service Worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);

        // 2. ขอสิทธิ์ Notification
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.warn('Notification permission denied');
            return;
        }

        // 3. สมัครรับ Push Notification (subscribe)
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
        });
        console.log('Push Subscription:', subscription);

        // 4. ส่ง subscription ไป backend เพื่อเก็บ
        await fetch('/api/save-subscription', {
            method: 'POST',
            body: JSON.stringify(subscription),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        setSubscription(subscription);
    }

    return (
        <div>
            {subscription ? <p>Push notifications enabled!</p> : <p>Loading...</p>}
        </div>
    )
}
