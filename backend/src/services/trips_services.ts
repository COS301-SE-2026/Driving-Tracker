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
}       