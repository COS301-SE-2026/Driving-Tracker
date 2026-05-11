//connection to the data base 
// not quite sure of the imports as yet 
import prisma from '../db/prisma';

export interface create_trip{
    user_id: string ;
    vehicle_id: string;
    data_source: string;
    start_date: Date;
    start_longitude: number;
    start_latitude: number;
};

export const trips_services ={
    async create(data: create_trip){
        if(!data.user_id || !data.vehicle_id ){
            throw new Error("Missing required fields");
        }
        if(!data.start_latitude && !data.start_longitude){
            throw new Error("Unknown start location");
        }// the trip can not start if the start location is not known

        try{
            //where the creation of the trip will happen

        }catch(error){

        }
    }
}       