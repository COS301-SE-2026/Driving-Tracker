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
};