import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { getSubscriptions, updateSubscriptions } from '@/app/lib/subscriptions';

const publicVapidKey = 'BDhju72ngefCEVdFFPC1-qpzNgDV7U8N-ENII-P6K8iMp_LfnCs38Z5AvMwqs6f9i_BVXEInw2RmmyXdK2_QtZ4';
const privateVapidKey = 'Femhnio7Ffp0GVkBrHgd4jYPJFFNxZZg-UoccQPKJe0';

// ตั้งค่า VAPID keys
webpush.setVapidDetails(
    'mailto:metee.th@kkumail.com',
    publicVapidKey,
    privateVapidKey
);

export async function POST(request: NextRequest) {
    const { title, body } = await request.json();

    const payload = JSON.stringify({ title, body });
    const subscriptions = getSubscriptions();

    console.log('Sending notifications to', subscriptions.length, 'subscriptions');

    const sendResults = [];
    const validSubscriptions = [];

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

    // อัปเดต subscriptions array ให้เหลือแค่ตัวที่ใช้งานได้
    updateSubscriptions(validSubscriptions);

    return NextResponse.json({ 
        message: 'Notifications sent', 
        results: sendResults,
        validSubscriptionsCount: validSubscriptions.length,
        totalSubscriptions: validSubscriptions.length
    });
}
