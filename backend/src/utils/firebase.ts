import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';

const service_account = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64!, "base64").toString("utf8")
);

initializeApp({
    credential: cert(service_account)
});

export { getMessaging } from 'firebase-admin/messaging';