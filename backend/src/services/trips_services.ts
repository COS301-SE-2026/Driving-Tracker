//connection to the data base 
// not quite sure of the imports as yet 
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
                fuel_estimate_l: updatedTrip.fuel_estimate,
                scores: {
                    safety_score: tripScore.safety_score,
                    eco_score: tripScore.eco_score,
                    overall_score: tripScore.overall_score
                },
                message: "Trip completed successfully"
            };

        }catch(error){
            throw error;
        }
    }
}       