import { NextRequest, NextResponse } from 'next/server';
import { addSubscription, getSubscriptions, getSubscriptionCount, clearSubscriptions, removeSubscription } from '@/app/lib/subscriptions';

export async function POST(request: NextRequest) {
    try {
        const subscription = await request.json();
        
        // ตรวจสอบว่า subscription มีข้อมูลครบถ้วน
        if (!subscription.endpoint) {
            return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 });
        }

        // ลบ subscription เก่าที่มี endpoint เดียวกัน (ถ้ามี)
        removeSubscription(subscription.endpoint);
        
        // เพิ่ม subscription ใหม่
        addSubscription(subscription);
        
        const count = getSubscriptionCount();
        console.log(`✅ Subscription updated. Total subscriptions: ${count}`);
        
        return NextResponse.json({ 
            message: 'Subscription saved.',
            totalSubscriptions: count,
            endpoint: subscription.endpoint.substring(0, 50) + '...'
        }, { status: 201 });
    } catch (error) {
        console.error('❌ Error saving subscription:', error);
        return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
    }
}

// เพิ่ม GET endpoint เพื่อดู subscriptions ที่มีอยู่
export async function GET() {
    try {
        const subscriptions = getSubscriptions();
        const count = getSubscriptionCount();
        
        console.log(`📊 GET /api/save-subscription - Returning ${count} subscriptions`);
        
        return NextResponse.json({ 
            subscriptions: subscriptions,
            count: count,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error getting subscriptions:', error);
        return NextResponse.json({ error: 'Failed to get subscriptions' }, { status: 500 });
    }
}

// เพิ่ม DELETE endpoint เพื่อลบ subscriptions ทั้งหมด (สำหรับการทดสอบ)
export async function DELETE() {
    try {
        const previousCount = getSubscriptionCount();
        clearSubscriptions();
        
        console.log(`🗑️ All subscriptions cleared. Previous count: ${previousCount}`);
        
        return NextResponse.json({ 
            message: 'All subscriptions cleared.',
            previousCount: previousCount,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Error clearing subscriptions:', error);
        return NextResponse.json({ error: 'Failed to clear subscriptions' }, { status: 500 });
    }
}
