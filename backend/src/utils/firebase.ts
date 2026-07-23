import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';

try{
    const service_account = JSON.parse(
        Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64!, "base64").toString("utf8")
    );

    initializeApp({
        credential: cert(service_account)
    });

} catch(err: any){
    console.log(err?.message?? "Could not start firebase");
}

export { getMessaging } from 'firebase-admin/messaging';