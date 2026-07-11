import { ExtendedError } from '../utils/errors';
import { getMessaging } from '../utils/firebase';
import { ConsentStatus } from '@prisma/client';


export const notification_services= {

    //Sends notification to user to request them to be a trusted contact
    async send_trusted_contact_request_notification(fcm_tokens: string[], sent_by: string, contact_id: string) {

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
                type: "TRUSTED_CONTACT_REQUEST",
                contact_id
            }
        }).catch( err => {
            const errorMessage = err instanceof Error? err.message: String(err);
            console.error("Failed to send trusted contact request notification: ", errorMessage)
            throw new ExtendedError("Could not send trusted contact request notification","COULD_NOT_SEND_NOTIFICATION"); 
        })
    },
    //Sends notification to user to respond to trusted contact request
    async send_trusted_contact_response_notification(fcm_tokens: string[], sent_by: string, status: ConsentStatus) {

        if(fcm_tokens.length === 0){
            throw new ExtendedError("No tokens provided","NO_TOKENS_PROVIDED");
        }

        const statusStr = (status === "APPROVED")? "accepted" : "declined";

        await getMessaging().sendEachForMulticast({
            fids: fcm_tokens,
            notification: {
                title: "Trusted Contact",
                body: `${sent_by} has ${statusStr} your Trusted Contact Request`
            },
            data: {
                type: "TRUSTED_CONTACT_RESPONSE"
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
    },
    //Sends general notifications
    async send_general_notification(fcm_tokens: string[], title: string, message: string){

        if(fcm_tokens.length === 0){
            throw new ExtendedError("No tokens provided","NO_TOKENS_PROVIDED");
        }

        await getMessaging().sendEachForMulticast({
            fids: fcm_tokens,
            notification: {
                title,
                body: message
            },
            data: {
                type: "GENERAL",
            }
        }).catch( err => {
            const errorMessage = err instanceof Error? err.message: String(err);
            console.error("Failed to trip alert: ", errorMessage)
            throw new ExtendedError("Could not send trip alert notification","COULD_NOT_SEND_NOTIFICATION"); 
        })

    },
    async send_badge_notification(fcm_tokens: string[], title: string = "New Badge Unlocked", message: string, badge_id: string, icon_url: string){

        if(fcm_tokens.length === 0){
            throw new ExtendedError("No tokens provided","NO_TOKENS_PROVIDED");
        }

        await getMessaging().sendEachForMulticast({
            fids: fcm_tokens,
            notification: {
                title,
                body: message
            },
            data: {
                type: "GAMIFICATION",
                icon_url,
                badge_id
            }
        }).catch( err => {
            const errorMessage = err instanceof Error? err.message: String(err);
            console.error("Failed to trip alert: ", errorMessage)
            throw new ExtendedError("Could not send trip alert notification","COULD_NOT_SEND_NOTIFICATION"); 
        })

    }

}