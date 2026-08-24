import prisma from '../db/prisma';
import { STOP_EVENT_STATUS, trips_services } from '../services/trips_services';
import { notify_unexpected_stop } from '../services/trips_services';

const POLL_INTERVAL_MS = 30_000

async function check_overdue_stops(){
    const overdue = await prisma.unexpected_stop_events.findMany({
        where: {
            status: STOP_EVENT_STATUS.POSSIBLE,
            check_after: { lte: new Date() },
        },
        take: 50,
    });

    for(const event of overdue){

        try{
            const resumed = await trips_services.has_trip_resumed_movement(event.trip_id, event.stopped_at);

            if(resumed){
                await prisma.unexpected_stop_events.updateMany({
                    where: { event_id: event.event_id, status: STOP_EVENT_STATUS.POSSIBLE },
                    data: { status: STOP_EVENT_STATUS.RESOLVED_MOVED, resolved_at: new Date() },
                });
                continue;
            }

            const result = await prisma.unexpected_stop_events.updateMany({
                where: { event_id: event.event_id, status: STOP_EVENT_STATUS.POSSIBLE },
                data: { status: STOP_EVENT_STATUS.CONFIRMED, escalated_at: new Date() },
            });

            if(result.count > 0){
                const fresh = await prisma.unexpected_stop_events.findUniqueOrThrow({
                    where: { event_id: event.event_id },
                });

                await notify_unexpected_stop(fresh);
            }
        }catch(error: any){
            console.error(`Failed processing stop event ${event.event_id}`, error);
        }
    }
}

export function start_stop_event_backstop(){
    setInterval(()=>{
        check_overdue_stops().catch((error: any)=> console.error('Stop event backstop tick failed', error));
    }, POLL_INTERVAL_MS);
}