import {Request, Response} from "express";
import {trips_services} from  "../services/trips_services";

//trips controllers will go here, so what is served by the api back to the frontend  
const var_trips_services = new trips_services();
export const start_trip = async (req: Request, res: Response) =>{
    try{
        const {user_id, vehicle_id, start_date, data_source, start_location}= req.body;

        //sending to services
        const new_trip = await var_trips_services.create({
            user_id,
            vehicle_id,
            start_date,
            data_source,
            start_location
        });

        res.status(200).json({
            message: "trip successfully started",
            data: new_trip
        });
    }catch(error: any){
        if(error.message.includes("Missing required fields")){
            res.status(403).json({
                message: "user or vehicle not known"
            });
        }
        if(error.message.includes("User not found")){
            res.status(403).json({
                message: "Unauthorized"
            });
        }
        if(error.message.includes("Trip already in progress")){
            res.status(409).json({
                error: "Trip already in progress"
            });
        }
    }
};
