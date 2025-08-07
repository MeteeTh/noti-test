'use client'

import { useEffect, useState, useRef } from 'react';

const publicVapidKey = 'BDhju72ngefCEVdFFPC1-qpzNgDV7U8N-ENII-P6K8iMp_LfnCs38Z5AvMwqs6f9i_BVXEInw2RmmyXdK2_QtZ4';

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
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const hasInitialized = useRef(false);
    const isProcessing = useRef(false);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window && !hasInitialized.current) {
            hasInitialized.current = true;
            initializePushManager().catch(console.error);
        } else if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push messaging is not supported');
        }
    }, []);

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

            console.log('✅ New subscription created');
            setSubscription(newSubscription);
            await saveSubscriptionToBackend(newSubscription);

        } catch (error) {
            console.error('❌ Error handling subscription:', error);
            throw error;
        }
    }

    async function validateSubscription(subscription: PushSubscription): Promise<boolean> {
        try {
            // ตรวจสอบว่า subscription มีข้อมูลครบถ้วน
            if (!subscription.endpoint) {
                return false;
            }

            // ตรวจสอบว่า endpoint ยังใช้งานได้
            const response = await fetch(subscription.endpoint, {
                method: 'HEAD'
            });
            
            return response.ok;
        } catch (error) {
            console.log('❌ Subscription validation failed:', error);
            return false;
        }
    }

    async function saveSubscriptionToBackend(subscription: PushSubscription) {
        try {
            console.log('💾 Saving subscription to backend...');
            
            const response = await fetch('/api/save-subscription', {
                method: 'POST',
                body: JSON.stringify(subscription),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Subscription saved to backend:', result);
            
        } catch (error) {
            console.error('❌ Error saving subscription to backend:', error);
            throw error;
        }
    }

    // ไม่แสดง UI ใดๆ เพราะทำงานในพื้นหลัง
    return null;
}
