// เก็บ subscriptions แยกจาก API route เพื่อหลีกเลี่ยงปัญหา Next.js build
export const subscriptions: PushSubscription[] = [];

export const addSubscription = (subscription: PushSubscription) => {
    // เช็คว่า subscription นี้เก็บแล้วหรือยัง โดยใช้ endpoint เป็น key
    const exists = subscriptions.findIndex(sub => sub.endpoint === subscription.endpoint) !== -1;
    if (!exists) {
        subscriptions.push(subscription);
        console.log('New subscription saved:', subscription.endpoint.substring(0, 50) + '...');
    } else {
        console.log('Subscription already exists:', subscription.endpoint.substring(0, 50) + '...');
    }
};

export const getSubscriptions = () => {
    return subscriptions;
};

export const clearSubscriptions = () => {
    subscriptions.length = 0;
    console.log('All subscriptions cleared');
};

export const updateSubscriptions = (newSubscriptions: PushSubscription[]) => {
    subscriptions.length = 0;
    subscriptions.push(...newSubscriptions);
    console.log('Subscriptions updated, count:', subscriptions.length);
};

export const removeSubscription = (endpoint: string) => {
    const index = subscriptions.findIndex(sub => sub.endpoint === endpoint);
    if (index !== -1) {
        subscriptions.splice(index, 1);
        console.log('Subscription removed:', endpoint.substring(0, 50) + '...');
        return true;
    }
    return false;
};

export const getSubscriptionCount = () => {
    return subscriptions.length;
};
