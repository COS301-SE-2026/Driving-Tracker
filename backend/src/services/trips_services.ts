//connection to the data base 
// not quite sure of the imports as yet 
import prisma from '../db/prisma';
import { notification_services } from './notification_service';
import { user_devices_services } from './user_devices_services';
import { fetch_vehicle_benchmark } from './vehicle.services';
import { map_services } from './map_services';
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
};
//helper to convert mpg to l/km 
function convert_mpg_to_lper_km(value:number):number|null{
    const mpg = to_number(value);
    if(!mpg){
        return null;
    }
    if( mpg <= 0){
        return 0;
    }
    return 235.215/mpg;
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
    end_location?:{
        lat:number;
        lng:number;
    };
    // distance_km?: number;
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
        console.log("Starting trip");
        if(!data.user_id || !data.vehicle_id ){
            throw new Error("Missing required fields");
        }
        if(!data.start_location.lat|| !data.start_location.lng){
            console.log("start location not found in data ");
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
            
            console.log("Found user now fetching the vehicle info ");
            //get the car info
            const vehicle_info = await prisma.vehicles.findUnique({
                where: {
                    vehicle_id: data.vehicle_id
                },
                select: {
                    make:true,
                    model:true,
                    year:true,
                }
            });
            if (!vehicle_info?.make || !vehicle_info?.model || !vehicle_info?.year) {
                console.log("Null info but my return ")
                return ;
            }

            const make = vehicle_info?.make;
            const model = vehicle_info?.model;
            const year = vehicle_info?.year;
            // const make = "BMW";
            // const model = "M3"
            // const year = 2018;
            let fuel_est: number | null = null;
            let planned_distance_km: number | null = null;
            if (data.end_location?.lat && data.end_location?.lng) {
                // Distance is computed server-side from Azure Maps, NOT taken from
                // data.distance_km — a client-supplied distance can't be trusted for
                // a number that feeds directly into the fuel-efficiency feature.
                const route = await map_services.suggested_routes({
                    start_lat: data.start_location.lat,
                    start_lng: data.start_location.lng,
                    dest_lat: data.end_location.lat,
                    dest_lng: data.end_location.lng,
                });
                planned_distance_km = route.distance_km;
 
                
                if(year >= 2015 && year <= 2020){
                    console.log("Using the fetch vehicle benchmark");
                    
                    const benchmark_trims = await fetch_vehicle_benchmark(make, model, year);
                    if (benchmark_trims.length === 0) {
                        console.log("No Benchamrk data");
                        throw new Error(`No benchmark data found for ${make} ${model} ${year}`);
                    }
    
                    const avg_mpg = benchmark_trims.reduce((sum, trim) => sum + trim.combined_mpg, 0) / benchmark_trims.length;
                    const lper100km = convert_mpg_to_lper_km(avg_mpg);
    
                    if (lper100km !== null) {
                        fuel_est = (lper100km / 100) * planned_distance_km;
                    }
                }
                fuel_est = null;
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
                        end_latitude:data.end_location?.lat,
                        end_longitude:data.end_location?.lng,
                        data_source: data.data_source,
                        fuel_estimate:fuel_est,
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

                    await notification_services.send_trip_shared_notification(fcm_tokens, full_name, newTrip.trip_id);

                }
                return newTrip;
            });

            return {
                trip_id: createdTrip.trip_id,
                data_source: createdTrip.data_source,
                planned_distance_km,
                fuel_estimate:fuel_est,
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
                    destination_latitude: to_number(trip.end_latitude),
                    destination_longitude: to_number(trip.end_longitude),
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
