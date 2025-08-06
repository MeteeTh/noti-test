// เก็บ subscriptions แยกจาก API route เพื่อหลีกเลี่ยงปัญหา Next.js build
export const subscriptions: PushSubscription[] = [];

export const addSubscription = (subscription: PushSubscription) => {
    // เช็คว่า subscription นี้เก็บแล้วหรือยัง (ลดซ้ำ)
    const exists = subscriptions.findIndex(sub => JSON.stringify(sub) === JSON.stringify(subscription)) !== -1;
    if (!exists) {
        subscriptions.push(subscription);
        console.log('Subscription saved:', subscription);
    }
};

export const getSubscriptions = () => {
    return subscriptions;
};

export const clearSubscriptions = () => {
    subscriptions.length = 0;
};

export const updateSubscriptions = (newSubscriptions: PushSubscription[]) => {
    subscriptions.length = 0;
    subscriptions.push(...newSubscriptions);
};
