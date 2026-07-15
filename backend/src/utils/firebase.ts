import { initializeApp, applicationDefault } from 'firebase-admin/app';

initializeApp({
    credential: applicationDefault()
});

export { getMessaging } from 'firebase-admin/messaging';