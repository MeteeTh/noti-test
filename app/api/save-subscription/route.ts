import { NextRequest, NextResponse } from 'next/server';

let subscriptions: PushSubscription[] = []; // เก็บชั่วคราว (เปลี่ยนเป็น DB จริงในโปรดักชัน)

export async function POST(request: NextRequest) {
    const subscription = await request.json();

    // เช็คว่า subscription นี้เก็บแล้วหรือยัง (ลดซ้ำ)
    const exists = subscriptions.findIndex(sub => JSON.stringify(sub) === JSON.stringify(subscription)) !== -1;
    if (!exists) {
        subscriptions.push(subscription);
        console.log('Subscription saved:', subscription);
    }

    return NextResponse.json({ message: 'Subscription saved.' }, { status: 201 });
}

// เพิ่ม GET endpoint เพื่อดู subscriptions ที่มีอยู่
export async function GET() {
    return NextResponse.json({ 
        subscriptions: subscriptions,
        count: subscriptions.length 
    });
}

// ฟังก์ชันสำหรับเรียกใช้ส่ง push ไปยัง subscription เหล่านี้
export { subscriptions };
