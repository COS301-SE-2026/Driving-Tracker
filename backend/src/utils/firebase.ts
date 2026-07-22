import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';

const service_account = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON!);

initializeApp({
    credential: cert(service_account)
});

export { getMessaging } from 'firebase-admin/messaging';