//connection to the data base 
// not quite sure of the imports as yet 
import prisma from '../db/prisma';
import { notification_services } from './notification_service';
import { user_devices_services } from './user_devices_services';
import { add_notification } from '../utils/notification';
import { contact_services } from './contacts_services';

// Helper function to safely convert Decimal or number values to number
function to_number(value: any): number | null {
    if (value === null || value === undefined) {
        return null;
    }
    // If it has a toNumber method (Prisma Decimal), use it
    if (typeof value.toNumber === 'function') {
        return value.toNumber();
    }
    // If it's already a number, return it
    if (typeof value === 'number') {
        return value;
    }
    // Otherwise try to convert to number
    return Number(value);
}

async function get_trip_shared_contacts(trip_id: string){

    const contacts = await prisma.trip_location_shares.findMany({
        where: {
            trip_id, revoked_at: null
        },
        select: {
            contact: {
                select: {
                    contact_user_id: true
                }
            },
            contact_id: true
        } 
    });

    if(!contacts||contacts.length){
        return { contact_user_ids: [], contact_ids: [] };
    }

    const contact_user_ids = contacts.map((c) => c.contact.contact_user_id);

    const contact_ids = contacts.map((c) => c.contact_id);

    return {contact_user_ids, contact_ids};

}

export interface create_trip{
    user_id: string ;
    vehicle_id: string;
    data_source: "OBD" | "PHONE";
    start_date: Date;
    start_location:{
        lat: number;
        lng: number;
    };
    share_with_contacts?: string[]; //optional
};
export interface trip_summary_filter {
    trip_id: string;
    user_id: string;
};
export interface end_trip {
    trip_id: string;
    user_id: string; 
    end_time: Date;
    route_polyline: string;
    distance_km: number;
    duration_minutes: number;
    fuel_estimate: number;
    status: "COMPLETED" | "ABORTED";
    safety_score: number;
    eco_score: number;
    overall_score: number;
};
export interface record_data{
    user_id: string;
    recorded_at: Date;
    trip_id: string;
    location:{
        lng : number;
        lat: number;
    }
    data_source:"OBD"|"PHONE";
    speed_kmh: number;
    accelerometer: number;
    gyroscope_x: number;
    gyroscope_y: number;
    gyroscope_z: number;
    rpm: number;
    coolant_temp: number;
    fuel_trim_percent: number;
    throttle_position: number;
    dtc_codes: string [];
};
export interface trip_history_filter {
    user_id: string;
    start_date?: Date;
    end_date?: Date;
    status?: "COMPLETED" | "IN_PROGRESS" | "ABORTED";
};
export interface trip_events_log{
    trip_id: string;
    user_id: string;
    event_type: "HARSH_BRAKE"| "HARSH_ACCELERATION"| "SHARP_CORNER"|"CRASH_LIKE";
    location:{
        lat: number;
        lng: number;
    }
    severity: number;
    sensor_source: "ACCELEROMETER"| "GYROSCOPE"|"OBD";
    recorded_at: Date;
}

export const trips_services ={
    async create(data: create_trip){
        if(!data.user_id || !data.vehicle_id ){
            throw new Error("Missing required fields");
        }
        if(!data.start_location.lat|| !data.start_location.lng){
            throw new Error("Unknown start location");
        }// the trip can not start if the start location is not known

        try{
            //where the creation of the trip will happen
            const user = await prisma.users.findUnique({
                where: {user_id: data.user_id}
            });
            if(!user){
                throw new Error("user not found");
            }//checks if the user exists 

            const activeTrip = await prisma.trips.findFirst({
                where: {
                    user_id: user.user_id,
                    status: "IN_PROGRESS"
                }
            });
            if (activeTrip) {
                throw new Error("Trip already in progress");
            }

            //create trip and shares atomically
            const createdTrip =  await prisma.$transaction(async (tx) => {
                const newTrip = await tx.trips.create({
                    data: {
                        user_id: user.user_id,
                        vehicle_id: data.vehicle_id,
                        start_time: data.start_date,
                        start_latitude: data.start_location.lat,
                        start_longitude: data.start_location.lng,
                        data_source: data.data_source,
                        status: "IN_PROGRESS"
                    }
                });

                //create shares if user explicitly selected contacts
                if(Array.isArray(data.share_with_contacts) && data.share_with_contacts.length){
                    // validate all provided contact_ids are user's trusted contacts with APPROVED consent
                    const valid = await tx.trusted_contacts.findMany({
                        where: {
                            user_id: data.user_id,
                            contact_id: { in: data.share_with_contacts},
                            consent_status: "APPROVED"
                        },
                        select: {contact_id: true, contact_user_id: true}
                    });

                    const validIds = valid.map(v => v.contact_id);
                    //if provided ids were invalid, throw error
                    if(validIds.length !== data.share_with_contacts.length){
                        throw new Error("Invalid contacts selection: some contacts not found or have not given consent.");
                    }

                    //create share rows
                    const shareRows = validIds.map(contact_id => ({
                        trip_id: newTrip.trip_id,
                        owner_user_id: data.user_id,
                        contact_id
                    }));
                    await tx.trip_location_shares.createMany({
                        data: shareRows,
                        skipDuplicates: true
                    });



                    const contact_user_ids = valid.map(v => v.contact_user_id);

                    const fcm_tokens = await user_devices_services.get_multiple_users_fcm_tokens(contact_user_ids);

                    const full_name = `${user.name ?? ""} ${user.surname ?? ""}`.trim() || user.username;
                    
                    
                    await add_notification({
                        user_ids: contact_user_ids,
                        type: "TRIP_SHARED",
                        title: "Trusted Contact",
                        body: `${full_name} is sharing their live trip with you`,
                        reference_ids: validIds,
                        reference_type: "trusted_contact",
                    });

                    await notification_services.send_trip_shared_notification(fcm_tokens, full_name, newTrip.trip_id);

                }
                return newTrip;
            });

            return {
                trip_id: createdTrip.trip_id,
                data_source: createdTrip.data_source
            };
        }catch(error){
            throw error;
        }
    },
    async end_trip(data:end_trip){
        
        if(!data.trip_id || !data.user_id){
            throw new Error("Missing required fields");
        }

        try{
            //fetch trip in data and check if the trip exists
            const trip = await prisma.trips.findUnique({
                where: { trip_id: data.trip_id}
            });
            if(!trip){
                throw new Error("Trip not found");
            }
             if (trip.user_id !== data.user_id) {
                throw new Error("You do not own this trip");
            }
            if(trip.status !== "IN_PROGRESS"){
                throw new Error(`Cannot end a trip with status: ${trip.status}`);
            }

            // Update the trip
            const updatedTrip = await prisma.trips.update({
                where: { trip_id: data.trip_id },
                data: {
                    end_time: data.end_time,
                    route_polyline: data.route_polyline,
                    distance_km: data.distance_km,
                    duration_minutes: data.duration_minutes,
                    fuel_estimate: data.fuel_estimate,
                    status: data.status
                }
            });
            // revoke any active shares for this trip
            await prisma.trip_location_shares.updateMany({
                where: { trip_id: data.trip_id, revoked_at: null },
                data: { revoked_at: new Date() }
            });

             // Create/Update trip scores
            const existing_score = await prisma.trip_scores.findFirst({
                where: {trip_id :data.trip_id}
            });

            let tripScore;
            if (existing_score) {
                tripScore = await prisma.trip_scores.update({
                    where: { score_id: existing_score.score_id },
                    data: {
                        safety_score: data.safety_score,
                        eco_score: data.eco_score,
                        overall_score: data.overall_score
                    }
                });
            } else {
                tripScore = await prisma.trip_scores.create({
                    data: {
                        trip_id: data.trip_id,
                        safety_score: data.safety_score,
                        eco_score: data.eco_score,
                        overall_score: data.overall_score
                    }
                });
            }

            //getting the user info
             const user = await prisma.users.findUnique({
                where: { user_id: data.user_id },
                select: { username: true }
            });
            // Count completed trips to see if this is the first one
            const completedTripCount = await prisma.trips.count({
                where: { user_id: data.user_id, status: "COMPLETED" }
            });

            return {
                trip_id: updatedTrip.trip_id,
                username: user?.username,
                status: updatedTrip.status,
                distance_km: updatedTrip.distance_km,
                duration_minutes: updatedTrip.duration_minutes,
                fuel_estimate: updatedTrip.fuel_estimate,
                scores: {
                    safety_score: tripScore.safety_score,
                    eco_score: tripScore.eco_score,
                    overall_score: tripScore.overall_score
                },
                is_first_trip: completedTripCount === 1
            };

        }catch(error){
            throw error;
        }
    },

    async record(data:record_data){//consistent trip update endpoint 
        if(!data.trip_id){
            throw new Error("Missing required fields");
        }

        try{
            if (!data.user_id) {
                throw new Error("Missing required fields");
            }

            const trip = await prisma.trips.findUnique({
                where: { trip_id: data.trip_id },
                select: { user_id: true }
            });
            if(!trip){
                throw new Error("Trip not found");
            }// verifying if the trip exists
            if(trip.user_id !== data.user_id){
                throw new Error("You do not own this trip");
            }

            const newReading = await prisma.trip_readings.create({
                data: {
                    trip_id: data.trip_id,
                    recorded_at: data.recorded_at,
                    data_source: data.data_source,
                    longitude: data.location.lng,
                    latitude: data.location.lat,
                    speed_kmh: data.speed_kmh,
                    accelerometer: data.accelerometer,
                    gyroscope_x: data.gyroscope_x,
                    gyroscope_y: data.gyroscope_y,
                    gyroscope_z: data.gyroscope_z,
                    rpm: data.rpm,
                    coolant_temp_c: data.coolant_temp,
                    fuel_trim_percent: data.fuel_trim_percent,
                    throttle_position: data.throttle_position,
                    dtc_codes: data.dtc_codes ?? []
                }
            });

        }catch(error){
            throw error;
        }
    },
    
    async get_history(data: trip_history_filter){
        if(!data.user_id){
            throw new Error("Missing required fields: user_id");
        }

        // Throw if a date was provided but it's not a valid date
        if (data.start_date && isNaN(data.start_date.getTime())) {
            throw new Error("Invalid start date");
        }
        if (data.end_date && isNaN(data.end_date.getTime())) {
            throw new Error("Invalid end date");
        }

        // Default to 30 days ago if no start_date is provided
        const start_date = data.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end_date = data.end_date || new Date();

        try{
            const user = await prisma.users.findUnique({
                where:{ user_id: data.user_id}
            });
            if(!user){
                throw new Error("User not found");
            }

            const date_conditions: any = {
                user_id: data.user_id,
                created_at:{
                    gte: start_date,
                    lte: end_date
                }
            };

            if(data.status){
                date_conditions.status = data.status;
            }

             const trips = await prisma.trips.findMany({
                where: date_conditions,
                include: {
                    trip_scores: {
                        select: {
                            safety_score: true,
                            eco_score: true,
                            overall_score: true
                        }
                    }
                },
                orderBy: { created_at: 'desc' }
            });

            const total_trips = trips.length;

            if(total_trips === 0){
                return {
                    username: user.username,
                    start_date: start_date,
                    end_date: end_date,
                    total_trips: 0,
                    trips: [],
                    meta: {
                        mean_distance: 0,
                        mean_minutes: 0
                    }
                };
            }

            let total_distance = 0;
            for (let n = 0; n < trips.length; n++) {
                total_distance += Number(trips[n].distance_km || 0);
            }
            const mean_distance = total_distance / total_trips;

            let total_minutes = 0;
            for(let i = 0; i < trips.length; i++){
                total_minutes += (trips[i].duration_minutes || 0);
            }
            const mean_minutes = total_minutes / total_trips;

            return {
                username: user.username,
                start_date: start_date,
                end_date: end_date,
                total_trips: total_trips,
                trips: trips,
                meta:{
                    mean_distance: parseFloat(mean_distance.toFixed(2)),
                    mean_minutes: parseFloat(mean_minutes.toFixed(2))
                }
            };

        } catch (error) {
            console.error("Database error in get_history:", error);
            throw error;
        }

    },

    async get_summary(data: trip_summary_filter){
        if(!data.user_id || !data.trip_id){
            throw new Error("Missing required fields");
        }

        try {
            const trip = await prisma.trips.findUnique({
                where: { trip_id: data.trip_id },
                include: {
                    trip_scores: {
                        select: {
                            safety_score: true,
                            eco_score: true,
                            overall_score: true
                        }
                    },
                    trip_events: {
                        select: {
                            event_id: true,
                            type: true,
                            longitude: true,
                            latitude: true,
                            severity: true,
                            sensor_source: true,
                            recorded_at: true
                        }
                    }
                }
            });
            if (!trip) {
                throw new Error("Trip not found");
            }

            // Check ownership
            if (trip.user_id !== data.user_id) {
                throw new Error("You do not own this trip");
            }

            // Determine data source (MIXED if both OBD and PHONE exist)
            const readings = await prisma.trip_readings.findMany({
                where: { trip_id: data.trip_id },
                select: { data_source: true,
                        dtc_codes:true,
                        recorded_at: true
                }
            });
            const data_sources = readings.map((r :any) => r.data_source).filter(Boolean);
            const data_source = data_sources.length > 1 ? "MIXED" : data_sources[0] || trip.data_source;

            const all_dtc_codes = [ ...new Set(readings.flatMap(r => r.dtc_codes))];
              return {
                data: {
                    trip_id: trip.trip_id,
                    vehicle_id: trip.vehicle_id,
                    started_At: trip.start_time,
                    ended_At: trip.end_time,
                    status: trip.status,
                    data_source: data_source,
                    route_polyline: trip.route_polyline,
                    distance_km: to_number(trip.distance_km),
                    duration_minutes: trip.duration_minutes,
                    fuel_estimate: to_number(trip.fuel_estimate),
                    scores: trip.trip_scores?.[0] ? {
                        safety_score: to_number(trip.trip_scores[0].safety_score),
                        eco_score: to_number(trip.trip_scores[0].eco_score),
                        overall_score: to_number(trip.trip_scores[0].overall_score)
                    } : null,
                    dtc_codes: all_dtc_codes,
                    events: trip.trip_events.map((event:any) => ({
                        event_id: event.event_id,
                        event_type: event.type,
                        longitude: to_number(event.longitude),
                        latitude: to_number(event.latitude),
                        severity: to_number(event.severity),
                        sensor_source: event.sensor_source,
                        time_stamp: event.recorded_at
                    }))
                }
            };
        } catch (error) {
            throw error;
        }
    },
    async events_log(data: trip_events_log){
        const validEventTypes = ["HARSH_BRAKE", "HARSH_ACCELERATION", "SHARP_CORNER", "CRASH_LIKE"];

        if(!data.trip_id||!data.user_id){
            throw new Error("Missing required trips");
        }
         if(!validEventTypes.includes(data.event_type)){
        throw new Error("Invalid event type");
        }
    
        if(!data.location.lat || !data.location.lng){
            throw new Error("Invalid location");
        }

        const user = await prisma.users.findUnique({
            where: { user_id: data.user_id }
            });

        if(!user){
            throw new Error("User not found");
        }

        try{
            const trip = await prisma.trips.findUnique({
                where: { trip_id:data.trip_id}
            });
            if(!trip){
                throw new Error("Trip not found");
            }
            if(trip.user_id !== data.user_id){
                throw new Error("You do not own this trip");
            }
             // Create event
        const newEvent = await prisma.trip_events.create({
            data: {
                trip_id: data.trip_id,
                type: data.event_type,
                latitude: data.location.lat,
                longitude: data.location.lng,
                severity: data.severity,
                sensor_source: data.sensor_source,
                recorded_at: data.recorded_at
            }
        });

        //Get contacts who had the ship shared with them
        const { contact_user_ids, contact_ids } = await get_trip_shared_contacts(data.trip_id);


        if (contact_user_ids.length > 0){
            
            const full_name = `${user.name ?? ""} ${user.surname ?? ""}`.trim() || user.username;

            const message = `${full_name} had a ${data.event_type} event at ${data.recorded_at}`;

            const alert = await contact_services.alert_contacts_for_event({
                user_id: data.user_id, 
                event_type: data.event_type,
                event_id: newEvent.event_id,
                message,
                contact_ids
            });

            const alert_ids = new Array(contact_user_ids.length).fill(alert.alert_id);
            
            await add_notification({
                user_ids: contact_user_ids,
                type: "TRIP_ALERT",
                title: "Trip Alert",
                body: message,
                reference_ids: alert_ids,
                reference_type: "alert",
            });

            //Get tokens for sending push notifications to contacts
            const fcm_tokens = await user_devices_services.get_multiple_users_fcm_tokens(contact_user_ids);

            const alert_type = data.event_type.replace("_"," ");

            await notification_services.send_trip_alert_notification(fcm_tokens, data.trip_id, alert_type, message);

        }
        
        
        return {
            data: {
                event_id: newEvent.event_id,
                trip_id: newEvent.trip_id,
                type: newEvent.type,
                severity: newEvent.severity,
                sensor_source: newEvent.sensor_source,
                timestamp: newEvent.recorded_at,
                message: "Event logged successfully"
            }
        };

        }catch(error){
            throw error;
        }

    }
};
