'use client'

import { useEffect, useState } from 'react';
import { Bell, Send, Users, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

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
    totalCount: number;
}

export default function Dashboard() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [notificationTitle, setNotificationTitle] = useState('');
    const [notificationBody, setNotificationBody] = useState('');
    const [sending, setSending] = useState(false);
    const [lastResult, setLastResult] = useState<{
        validSubscriptionsCount?: number;
        totalSubscriptions?: number;
        results?: Array<{ status: string; [key: string]: unknown }>;
    } | null>(null);
    const [notificationHistory, setNotificationHistory] = useState<NotificationHistory[]>([]);
    const [loading, setLoading] = useState(true);

    // โหลด subscriptions
    const loadSubscriptions = async () => {
        try {
            const response = await fetch('/api/save-subscription');
            const data = await response.json();
            setSubscriptions(data.subscriptions);
        } catch (error) {
            console.error('Error loading subscriptions:', error);
        } finally {
            setLoading(false);
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
            
            // เพิ่มประวัติการส่ง
            const newHistory: NotificationHistory = {
                id: Date.now().toString(),
                title: notificationTitle,
                body: notificationBody,
                sentAt: new Date(),
                successCount: result.validSubscriptionsCount || 0,
                failCount: (result.results?.filter((r: { status: string }) => r.status === 'fail').length) || 0,
                totalCount: result.totalSubscriptions || 0
            };
            
            setNotificationHistory(prev => [newHistory, ...prev.slice(0, 9)]); // เก็บ 10 รายการล่าสุด
            
            // รีเฟรช subscriptions หลังจากส่ง
            await loadSubscriptions();
            
            // ล้างฟอร์ม
            setNotificationTitle('');
            setNotificationBody('');
        } catch (error) {
            console.error('Error sending notification:', error);
        } finally {
            setSending(false);
        }
    };

    useEffect(() => {
        loadSubscriptions();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="container mx-auto p-6">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Push Notification Dashboard</h1>
                    <p className="text-gray-700">จัดการและส่งการแจ้งเตือนแบบ Real-time</p>
                </div>
                
                {/* สถิติ */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-700">Active Subscriptions</p>
                                <p className="text-2xl font-bold text-gray-900">{subscriptions.length}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-700">Last Success</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {lastResult ? lastResult.validSubscriptionsCount : 0}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500">
                        <div className="flex items-center">
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <Clock className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-700">Total Sent</p>
                                <p className="text-2xl font-bold text-gray-900">{notificationHistory.length}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                        <div className="flex items-center">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <Bell className="h-6 w-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-700">Status</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {subscriptions.length > 0 ? 'Ready' : 'No Subs'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* ส่ง Notification */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-800">
                            <Send className="h-5 w-5 mr-2 text-blue-600" />
                            ส่ง Notification
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-800">หัวข้อ</label>
                                <input
                                    type="text"
                                    value={notificationTitle}
                                    onChange={(e) => setNotificationTitle(e.target.value)}
                                    className="placeholder:text-gray-400 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="กรอกหัวข้อ notification"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-800">เนื้อหา</label>
                                <textarea
                                    value={notificationBody}
                                    onChange={(e) => setNotificationBody(e.target.value)}
                                    className="placeholder:text-gray-400 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={4}
                                    placeholder="กรอกเนื้อหา notification"
                                />
                            </div>
                            <button
                                onClick={sendNotification}
                                disabled={sending}
                                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center"
                            >
                                {sending ? (
                                    <>
                                        <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                                        กำลังส่ง...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-5 w-5 mr-2" />
                                        ส่ง Notification
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* รายการ Subscriptions */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-gray-800 text-xl font-semibold mb-4 flex items-center">
                            <Users className="h-5 w-5 mr-2 text-green-600" />
                            Active Subscriptions
                        </h2>
                        {subscriptions.length === 0 ? (
                            <div className="text-center py-8">
                                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-700">ไม่มี subscription ที่ใช้งานได้</p>
                                <p className="text-sm text-gray-600">เปิดเว็บไซต์และอนุญาต notification</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {subscriptions.map((sub, index) => (
                                    <div key={index} className="border border-gray-200 p-4 rounded-lg hover:bg-gray-50">
                                        <div className="flex justify-between items-start">
                                                                                    <div className="flex-1">
                                            <p className="font-medium text-sm text-gray-800">Device {index + 1}</p>
                                            <p className="text-xs text-gray-600 break-all mt-1">
                                                {sub.endpoint.substring(0, 50)}...
                                            </p>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Auth: {sub.keys.auth.substring(0, 10)}...
                                            </p>
                                        </div>
                                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                                                Active
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ประวัติการส่ง */}
                <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-gray-800 text-xl font-semibold mb-4 flex items-center">
                        <Clock className="h-5 w-5 mr-2 text-purple-600" />
                        ประวัติการส่ง
                    </h2>
                    {notificationHistory.length === 0 ? (
                        <div className="text-center py-8">
                            <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-700">ยังไม่มีประวัติการส่ง</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {notificationHistory.map((history) => (
                                <div key={history.id} className="border border-gray-200 p-4 rounded-lg hover:bg-gray-50">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-800">{history.title}</h3>
                                            <p className="text-gray-600 mt-1">{history.body}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-500">
                                                {history.sentAt.toLocaleString('th-TH')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4 text-sm">
                                        <div className="flex items-center text-green-600">
                                            <CheckCircle className="h-4 w-4 mr-1" />
                                            <span>{history.successCount} สำเร็จ</span>
                                        </div>
                                        <div className="flex items-center text-red-600">
                                            <XCircle className="h-4 w-4 mr-1" />
                                            <span>{history.failCount} ล้มเหลว</span>
                                        </div>
                                        <div className="text-gray-500">
                                            รวม {history.totalCount} ครั้ง
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ผลลัพธ์ล่าสุด */}
                {lastResult && (
                    <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">ผลลัพธ์ล่าสุด</h2>
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <pre className="text-sm overflow-auto text-gray-700">
                                {JSON.stringify(lastResult, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
