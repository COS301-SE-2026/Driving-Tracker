import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { trips_services } from "../services/trips_services";
import { error } from "console";
import { ExtendedError } from "../utils/errors";

//trips controllers will go here, so what is served by the api back to the frontend  

export const start_trip = async (req: AuthRequest, res: Response) =>{
    try{
        const user_id = req.user?.sub;
        if(!user_id){
            res.status(403).json({message: 'Unauthorized'});
            return ;
        }
        const { vehicle_id, start_date, data_source, start_location, share_with_contacts}= req.body;

        //sending to services
        const new_trip = await trips_services.create({
            user_id,
            vehicle_id,
            start_date,
            data_source,
            start_location,
            share_with_contacts
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

        if((error instanceof ExtendedError)){

            if(error.errorCode=="NO_TOKENS_PROVIDED"){
               return res.status(422).json({error: error.errorCode, message: error.message});
            }

            res.status(500).json({error: error.errorCode, message: error.message});
        }
    }
};

export const end_trip = async (req:AuthRequest, res:Response) =>{
    try{
        const { trip_id } = req.params;
        const user_id = req.user?.sub; // From JWT decoded by verifyToken middleware
        const { end_time, route_polyline, distance_km, duration_minutes, fuel_estimate, status, safety_score, eco_score, overall_score } = req.body;

        if(!user_id){
            res.status(400).json({
                error:"UNAUTHORIZED"
            });
            return;
        }
        const end_trip_results = await trips_services.end_trip({
            trip_id,
            user_id,
            end_time,
            route_polyline,
            distance_km,
            duration_minutes,
            fuel_estimate,
            status,
            safety_score,
            eco_score,
            overall_score
        });

        res.status(200).json({
            message:"Trip completed successfully",
            data:end_trip_results
        });
    }catch(error: any){
        if(error.message.includes("Trip not found")){
            res.status(404).json({ error: "Trip not found" });
        } else if(error.message.includes("You do not own this trip")){
            res.status(403).json({
                error: "You do not own this trip" 
            });
        }else if(error.message.includes("Cannot end a trip with status")){
            res.status(409).json({ error: "Trip is already completed"});
        } 
        else{
            res.status(500).json({ error: "Internal server error" });
        }
    }
};

export const record_trip = async (req:AuthRequest, res:Response) =>{
    try{
        const user_id = req.user?.sub;
        const 	{	trip_id,
                recorded_at,
                data_source,
                location,
                speed_kmh,
                accelerometer,
                gyroscope_x,
                gyroscope_y,
                gyroscope_z,
                rpm,
                coolant_temp,
                fuel_trim_percent,
                throttle_position,
                dtc_codes
            }= req.body;
            if(!user_id){
                res.status(400).json({
                    error:"UNAUTHORIZED"
                });
                return;
            }

        const record_trip_results = await trips_services.record({
            user_id,
            trip_id,
                recorded_at,
                data_source,
                location,
                speed_kmh,
                accelerometer,
                gyroscope_x,
                gyroscope_y,
                gyroscope_z,
                rpm,
                coolant_temp,
                fuel_trim_percent,
                throttle_position,
                dtc_codes
        });
        res.status(201).json({
            message:"Recorded successfully"
        });
        
    }catch(error: any){
        if(error.message.includes("Missing required fields")){
            res.status(401).json({
                error: "Fill all valid fields"
            });
        }else if(error.message.includes("Trip not found")){
            res.status(404).json({
                error:"Trip not found"
            });
        }else if(error.message.includes("You do not own this trip")){
            res.status(400).json({error:"UNAUTHORIZED"});
        }
    }
};

export const get_history = async (req:AuthRequest, res:Response)=>{
    try{
        const user_id = req.user?.sub;//jwt token 
        // Use req.query for GET requests
        const {start_date, end_date, status} = (req.query || {}) as any;

        if(!user_id){
            res.status(400).json({
                error:"UNAUTHORIZED",
                message:"user not identified"
            });
            return;
        }

        const history_results = await trips_services.get_history({
            user_id,
            start_date: start_date ? new Date(start_date) : undefined,
            end_date: end_date ? new Date(end_date) : undefined,
            status: status as any
        });

         res.status(200).json({
            message: "Trip history retrieved successfully",
            data: history_results
        });
    }catch(error :any){
        console.error("Error in get_history:", error);
        if (error.message.includes("User not found")) {
            res.status(404).json({
                error: "User not found"
            });
        } else if (error.message.includes("Invalid")) {
            res.status(400).json({
                error: error.message
            });
        } else {
            res.status(500).json({
                error: "Internal server error"
            });
        }
    }
};
export const get_trip_summary = async (req: AuthRequest, res: Response) => {
    try {
        const { trip_id } = req.params;
        const user_id = req.user?.sub;

        if (!user_id) {
            res.status(401).json({ 
                error: "UNAUTHORIZED", 
                message: "Can not view this trip" 
            });
            return;
        }

        const summary = await trips_services.get_summary({ trip_id, user_id });
        res.status(200).json(summary);

    } catch(error: any) {
        if(error.message.includes("Trip not found")) {
            res.status(404).json({ 
                error: "NOT_FOUND", 
                message: "Trip not found" 
            });
        } else if(error.message.includes("You do not own this trip")) {
            res.status(403).json({ 
                error: "FORBIDDEN",
                 message: "You do not own this trip" 
                });
        } else{
            res.status(500).json({ 
                error: "Internal server error" 
            });
        }
    }
};
export const log_event = async (req: AuthRequest, res: Response) => {
    try {
        const { trip_id } = req.params;
        const user_id = req.user?.sub;
        const { event_type, location, severity, sensor_source, timestamp } = req.body;

        if (!user_id){
            res.status(401).json({ 
                error: "UNAUTHORIZED" 
            });
            return;
        }

        const result = await trips_services.events_log({
            trip_id,
            user_id,
            event_type,
            location,
            severity,
            sensor_source,
            recorded_at: new Date(timestamp)
        });

        res.status(201).json(result);
    } catch(error: any){
        if (error.message.includes("Trip not found")){
            res.status(404).json({ 
                error: "TRIP_NOT_FOUND", 
                message: "Trip not found" 
            });
        } else if (error.message.includes("You do not own this trip")) {
            res.status(403).json({ 
                error: "FORBIDDEN", 
                message: "You do not own this trip"
            });
        } else if (error.message.includes("Invalid event type")) {
            res.status(400).json({ 
                error: "INVALID_EVENT_TYPE"
            });
        } else {
            res.status(500).json({ 
                error: "Internal server error" 
            });
        }
    }
};