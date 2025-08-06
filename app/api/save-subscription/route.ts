import { NextRequest, NextResponse } from 'next/server';
import { addSubscription, getSubscriptions } from '@/app/lib/subscriptions';

export async function POST(request: NextRequest) {
    const subscription = await request.json();
    addSubscription(subscription);
    return NextResponse.json({ message: 'Subscription saved.' }, { status: 201 });
}

// เพิ่ม GET endpoint เพื่อดู subscriptions ที่มีอยู่
export async function GET() {
    const subscriptions = getSubscriptions();
    return NextResponse.json({ 
        subscriptions: subscriptions,
        count: subscriptions.length 
    });
}
