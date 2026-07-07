import { ExtendedError } from '../utils/errors';
import { getMessaging } from '../utils/firebase';


export const notification_services= {

    //Sends push notification for to trusted contacts for shared trips
    async send_trip_shared_notification(fcm_tokens: string[], shared_by: string, trip_id: string){


        await getMessaging().sendEachForMulticast({
            fids: fcm_tokens,
            notification: {
                title: "Trip Shared With You",
                body: `${shared_by} is sharing their live trip with you`
            },
            data: {
                type: "SHARED_TRIP",
                trip_id,
                shared_by
            }
        })

    },
    async send_trip_alert_notification(fcm_tokens: string[], trip_id: string, alert_type: string, message: string){

        if(fcm_tokens.length === 0){
            throw new ExtendedError("No tokens provided","NO_TOKENS_PROVIDED");
        }

        await getMessaging().sendEachForMulticast({
            fids: fcm_tokens,
            notification: {
                title: alert_type,
                body: message
            },
            data: {
                type: "TRIP_ALERT",
                alert_type,
                trip_id
            }
        })
    }

}