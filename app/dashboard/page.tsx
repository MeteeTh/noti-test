'use client'

import { useEffect, useState } from 'react';

interface Subscription {
    endpoint: string;
    expirationTime: string | null;
    keys: {
        p256dh: string;
        auth: string;
    };
}

interface NotificationHistory {
    id: string;
    title: string;
    body: string;
    sentAt: Date;
    successCount: number;
    failCount: number;
}

export default function Dashboard() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [notificationTitle, setNotificationTitle] = useState('');
    const [notificationBody, setNotificationBody] = useState('');
    const [sending, setSending] = useState(false);
    const [lastResult, setLastResult] = useState<any>(null);

    // โหลด subscriptions
    const loadSubscriptions = async () => {
        try {
            const response = await fetch('/api/save-subscription');
            const data = await response.json();
            setSubscriptions(data.subscriptions);
        } catch (error) {
            console.error('Error loading subscriptions:', error);
        }
    };

    // ส่ง notification
    const sendNotification = async () => {
        if (!notificationTitle || !notificationBody) {
            alert('กรุณากรอกหัวข้อและเนื้อหา');
            return;
        }

        setSending(true);
        try {
            const response = await fetch('/api/send-notification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: notificationTitle,
                    body: notificationBody
                })
            });
            const result = await response.json();
            setLastResult(result);
            
            // รีเฟรช subscriptions หลังจากส่ง
            await loadSubscriptions();
        } catch (error) {
            console.error('Error sending notification:', error);
        } finally {
            setSending(false);
        }
    };

    useEffect(() => {
        loadSubscriptions();
    }, []);

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Push Notification Dashboard</h1>
            
            {/* สถิติ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-100 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800">Active Subscriptions</h3>
                    <p className="text-2xl font-bold text-blue-600">{subscriptions.length}</p>
                </div>
                <div className="bg-green-100 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800">Last Sent</h3>
                    <p className="text-sm text-green-600">
                        {lastResult ? `${lastResult.validSubscriptionsCount} successful` : 'None'}
                    </p>
                </div>
                <div className="bg-yellow-100 p-4 rounded-lg">
                    <h3 className="font-semibold text-yellow-800">Status</h3>
                    <p className="text-sm text-yellow-600">
                        {subscriptions.length > 0 ? 'Ready' : 'No subscriptions'}
                    </p>
                </div>
            </div>

            {/* ส่ง Notification */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-semibold mb-4">Send Notification</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">หัวข้อ</label>
                        <input
                            type="text"
                            value={notificationTitle}
                            onChange={(e) => setNotificationTitle(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            placeholder="กรอกหัวข้อ notification"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">เนื้อหา</label>
                        <textarea
                            value={notificationBody}
                            onChange={(e) => setNotificationBody(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            rows={3}
                            placeholder="กรอกเนื้อหา notification"
                        />
                    </div>
                    <button
                        onClick={sendNotification}
                        disabled={sending}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
                    >
                        {sending ? 'กำลังส่ง...' : 'ส่ง Notification'}
                    </button>
                </div>
            </div>

            {/* ผลลัพธ์ล่าสุด */}
            {lastResult && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <h2 className="text-xl font-semibold mb-4">ผลลัพธ์ล่าสุด</h2>
                    <div className="bg-gray-100 p-4 rounded-md">
                        <pre className="text-sm overflow-auto">
                            {JSON.stringify(lastResult, null, 2)}
                        </pre>
                    </div>
                </div>
            )}

            {/* รายการ Subscriptions */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Active Subscriptions</h2>
                {subscriptions.length === 0 ? (
                    <p className="text-gray-500">ไม่มี subscription ที่ใช้งานได้</p>
                ) : (
                    <div className="space-y-4">
                        {subscriptions.map((sub, index) => (
                            <div key={index} className="border border-gray-200 p-4 rounded-md">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">Endpoint:</p>
                                        <p className="text-xs text-gray-600 break-all">{sub.endpoint}</p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Auth: {sub.keys.auth.substring(0, 10)}...
                                        </p>
                                    </div>
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                        Active
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
