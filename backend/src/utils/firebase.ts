import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

initializeApp({
    credential: applicationDefault()
});

export { getMessaging };