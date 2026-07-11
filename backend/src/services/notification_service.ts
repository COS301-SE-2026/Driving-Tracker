import { ExtendedError } from '../utils/errors';
import { getMessaging } from '../utils/firebase';


export const notification_services= {

    //Sends notification to user to request them to be a trusted contact
    async send_trusted_contact_request_notification(fcm_tokens: string[], sent_by: string) {

        if(fcm_tokens.length === 0){
            throw new ExtendedError("No tokens provided","NO_TOKENS_PROVIDED");
        }

        await getMessaging().sendEachForMulticast({
            fids: fcm_tokens,
            notification: {
                title: "Trusted Contact Request",
                body: `${sent_by} wants to add you as a trusted contact`
            },
            data: {
                type: "TRUSTED_CONTACT_REQUEST"
            }
        }).catch( err => {
            const errorMessage = err instanceof Error? err.message: String(err);
            console.error("Failed to send trusted contact request notification: ", errorMessage)
            throw new ExtendedError("Could not send trusted contact request notification","COULD_NOT_SEND_NOTIFICATION"); 
        })
    },

    //Sends push notification to trusted contacts for shared trips
    async send_trip_shared_notification(fcm_tokens: string[], shared_by: string, trip_id: string){

        if(fcm_tokens.length === 0){
            throw new ExtendedError("No tokens provided","NO_TOKENS_PROVIDED");
        }

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
        }).catch( err => {
            const errorMessage = err instanceof Error? err.message: String(err);
            console.error("Failed to send share trip notification: ", errorMessage)
            throw new ExtendedError("Could not send share trip notification","COULD_NOT_SEND_NOTIFICATION"); 
        })

    },
    //sends push notification for trip related alerts
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
        }).catch( err => {
            const errorMessage = err instanceof Error? err.message: String(err);
            console.error("Failed to trip alert: ", errorMessage)
            throw new ExtendedError("Could not send trip alert notification","COULD_NOT_SEND_NOTIFICATION"); 
        })
    }

}