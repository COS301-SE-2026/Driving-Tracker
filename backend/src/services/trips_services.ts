//connection to the data base 
// not quite sure of the imports as yet 
import { error } from 'console';
import prisma from '../db/prisma';

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
}

export class trips_services {
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
    }
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
            const tripScore = await prisma.trip_scores.upsert({
                where: { trip_id: data.trip_id },
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
    }

    async record(data:record_data){//consistent trip update endpoint 
        if(!data.trip_id){
            throw new Error("Missing required fields");
        }

        try{
            const trip_reading = await prisma.trip_readings.findUnique({
            where:{ trip_id: data.trip_id}
            });
            if(!trip_reading){
                throw new Error("Trip not found");
            }// verifying if the trip exists

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
    }
}       