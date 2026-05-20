//connection to the data base 
// not quite sure of the imports as yet 
import prisma from '../db/prisma';

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

export interface create_trip{
    user_id: string ;
    vehicle_id: string;
    data_source: string;
    start_date: Date;
    start_location:{
        lat: number;
        lng: number;
    };
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
    dtc_codes: string;
};
export interface trip_history_filter {
    user_id: string;
    start_date: Date;
    end_date?: Date;
    status?: "COMPLETED" | "IN_PROGRESS" | "ABORTED";
};
export interface trip_events_log{
    trip_id: string;
    user_id: string;
    event_type: "HARSH_BRAKE"| "HARSH_ACCELERATION"| "SHARP_CORNER"|"CRASH";
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
            const newTrip = await prisma.trips.create({
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

            return {
                trip_id: newTrip.trip_id,
                data_source: newTrip.data_source
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
             // Create/Update trip scores
            const existing_score = await prisma.trip_scores.findFirst({
                where: {trip_id :data.trip_id}
            });
            const tripScore = await prisma.trip_scores.upsert({
                where: { score_id: existing_score?.score_id || "" },
                update: {
                    safety_score: data.safety_score,
                    eco_score: data.eco_score,
                    overall_score: data.overall_score
                },
                create: {
                    trip_id: data.trip_id,
                    safety_score: data.safety_score,
                    eco_score: data.eco_score,
                    overall_score: data.overall_score
                }
            });

            //getting the user info
             const user = await prisma.users.findUnique({
                where: { user_id: data.user_id },
                select: { username: true }
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
                }
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
                    dtc_codes: data.dtc_codes ? [data.dtc_codes] : []
                }
            });

        }catch(error){
            throw error;
        }
    },
    
    async get_history(data: trip_history_filter){
        if(!data.user_id || !data.start_date){
            throw new Error("Missing required fields");
        }
        if (isNaN(data.start_date.getTime())) {
            throw new Error("Invalid start date");
        }

        const end_date = data.end_date || new Date();
        if (isNaN(end_date.getTime())) {
            throw new Error("Invalid end date");
        }
        try {
            const user = await prisma.users.findUnique({
                where:{ user_id: data.user_id}
            });
            if(!user){
                throw new Error("User not found");//unauthorized 
            }

            const date_conditions: any = {
                user_id: data.user_id,
                created_at:{
                    gte: data.start_date,
                    lte: end_date
                }
            };

            if(!data.status){
                console.log("No status");
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

            if(trips.length === 0){
                throw new Error("No trips found");
            }
            const total_trips = trips.length;
            let total_distance = 0;
            for (let n = 0; n < trips.length; n++) {
                total_distance += Number(trips[n].distance_km || 0);
            }
            const mean_distance = total_trips > 0 ? total_distance / total_trips : 0;

            let total_minutes = 0;
            for(let i = 0; i < trips.length; i++){
                total_minutes += (trips[i].duration_minutes || 0);
            }
            const mean_minutes = total_trips > 0 ? total_minutes / total_trips : 0;
            return{
                data:{
                    username: user.username,
                    start_date: data.start_date,
                    end_date: end_date,
                    total_trips:total_trips,
                    trips: trips,
                    meta:{
                        mean_distance: parseFloat(mean_distance.toFixed(2)),
                        mean_minutes: parseFloat(mean_minutes.toFixed(2))
                    }
                }
            };

        } catch (error) {
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
                select: { data_source: true },
                distinct: ['data_source']
            });
            const data_sources = readings.map((r :any) => r.data_source).filter(Boolean);
            const data_source = data_sources.length > 1 ? "MIXED" : data_sources[0] || trip.data_source;

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