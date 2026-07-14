import prisma from '../db/prisma';
import { ExtendedError } from '../utils/errors';

export const user_devices_services={

    async register_device_token(user_id: string, fcm_token: string){

        try{

            await prisma.user_devices.upsert({
            where: {fcm_token: fcm_token },
            update: {updated_at: new Date() },
            create: { 
                user_id: user_id,
                fcm_token: fcm_token
            }
         });

        } catch(err: any){

            throw new ExtendedError("Cannot register token","INTERNAL_SERVER_ERROR");
        }

    },
    //Gets a user's fcm_tokens (One for each device the user has the app on)
    async get_user_fcm_tokens(user_id: string){

        try{

            const tokens = await prisma.user_devices.findMany({
                where: { user_id },
                select: { fcm_token: true }
            });

            const user_tokens = tokens.map(item=>item.fcm_token);

            return user_tokens;

        } catch(err: any){

            throw new ExtendedError("Could not retrieve user fcm tokens", "FCM_TOKEN_RETRIEVAL_ERROR");
            
        }
    },
    //Gets multiple users' fcm_tokens
    async get_multiple_users_fcm_tokens(user_ids: string[]){

         try{

            const tokens = await prisma.user_devices.findMany({
                where: { 
                    user_id: { in: user_ids } 
                    },
                select: { fcm_token: true }
            });

            const user_tokens = tokens.map(item=>item.fcm_token);

            return user_tokens;

        } catch(err: any){

            throw new ExtendedError("Could not retrieve user fcm tokens", "FCM_TOKEN_RETRIEVAL_ERROR");
            
        }
    }     
};