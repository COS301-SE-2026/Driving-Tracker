import prisma from '../db/prisma';
import { NotificationType } from '@prisma/client';

function coded_error(code: string){
    const err: any = new Error(code);
    err.code = code;
    return err;
}

export async function add_notification(input: {
        user_ids: string[];
        type: string;
        title: string;
        body: string | null;
        reference_ids: string[];
        reference_type: string | null;
    }){

        if(!Object.values(NotificationType).includes(input.type as NotificationType)){
            throw coded_error("INVALID_NOTIFICATION_TYPE");
        }

        if(input.user_ids.length !== input.reference_ids?.length){
            throw coded_error("Users and references length mismatch");
        }

        const entries = input.user_ids.map((user_id, index) => ({
            user_id: user_id,
            type: input.type,
            title: input.title,
            body: input.body,
            reference_id: input.reference_ids? input.reference_ids[index] : null,
            reference_type: input.reference_type
        }));

        await prisma.notifications.createMany({
            data: entries.map((entry) => ({
                user_id: entry.user_id,
                type: entry.type as NotificationType,
                title: entry.title,
                body: entry.body?? null,
                reference_id: entry.reference_id?? null,
                reference_type: entry.reference_type?? null,
            })),
            skipDuplicates: true
        });
    }