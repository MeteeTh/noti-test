'use client'

import { useEffect, useState } from 'react';
import { Bell, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [notificationStatus, setNotificationStatus] = useState<'granted' | 'denied' | 'default' | 'loading'>('loading');
  const [subscriptionCount, setSubscriptionCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<string>('');



  useEffect(() => {
    // ตรวจสอบสถานะการแจ้งเตือน
    const checkNotificationStatus = () => {
      if ('Notification' in window) {
        setNotificationStatus(Notification.permission);
      }
    };

    // โหลดจำนวน subscriptions
    const loadSubscriptionCount = async () => {
      try {
        const response = await fetch('/api/save-subscription');
        const data = await response.json();
        setSubscriptionCount(data.count || 0);
        setLastUpdate(data.timestamp || new Date().toISOString());
      } catch (error) {
        console.error('Error loading subscription count:', error);
      }
    };

    checkNotificationStatus();
    loadSubscriptionCount();

    // ตรวจสอบการเปลี่ยนแปลงสถานะทุก 3 วินาที
    const interval = setInterval(() => {
      checkNotificationStatus();
      loadSubscriptionCount();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusText = () => {
    switch (notificationStatus) {
      case 'granted':
        return 'อนุญาตแล้ว';
      case 'denied':
        return 'ถูกปฏิเสธ';
      case 'default':
        return 'ยังไม่ได้ตั้งค่า';
      default:
        return 'กำลังตรวจสอบ...';
    }
  };

  const getStatusIcon = () => {
    switch (notificationStatus) {
      case 'granted':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'denied':
        return <XCircle className="h-6 w-6 text-red-600" />;
      default:
        return <Bell className="h-6 w-6 text-yellow-600" />;
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <Bell className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Push Notification Demo</h1>
            <p className="text-gray-600">ระบบแจ้งเตือนแบบ Real-time</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-700">สถานะการแจ้งเตือน:</span>
              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <span className={`font-medium ${
                  notificationStatus === 'granted' ? 'text-green-600' :
                  notificationStatus === 'denied' ? 'text-red-600' :
                  'text-yellow-600'
                }`}>
                  {getStatusText()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-700">จำนวน Subscriptions:</span>
              <span className="font-bold text-blue-600">{subscriptionCount}</span>
            </div>
            
            {lastUpdate && (
              <div className="text-xs text-gray-500 text-center">
                อัปเดตล่าสุด: {new Date(lastUpdate).toLocaleString('th-TH')}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Link 
              href="/dashboard"
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 font-medium flex items-center justify-center transition-all duration-200"
            >
              <span>ไปยัง Dashboard</span>
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
            
            {notificationStatus === 'denied' && (
              <p className="text-sm text-red-600 mt-4">
                หมายเหตุ: กรุณาอนุญาตการแจ้งเตือนในเบราว์เซอร์เพื่อใช้งานฟีเจอร์นี้
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
