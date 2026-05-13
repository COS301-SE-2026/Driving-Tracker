import {Request, Response} from "express";
import {trips_services} from  "../services/trips_services";
import { error } from "console";

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

export const end_trip = async (req:Request, res:Response) =>{
    try{
        const { trip_id } = req.params;
        const user_id = (req as any).user?.user_id; // From JWT decoded by verifyToken middleware
        const { end_time, route_polyline, distance_km, duration_minutes, fuel_estimate, status, safety_score, eco_score, overall_score } = req.body;

        if(!user_id){
            res.status(400).json({
                error:"UNAUTHORIZED"
            });
        }
        const end_trip_results = await var_trips_services.end_trip({
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
            res.status(403).json({ error: "You do not own this trip" });
        } else{
            res.status(500).json({ error: "Internal server error" });
        }
    }
};

export const record_trip = async (req:Request, res:Response) =>{
    try{
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

        const record_trip_results = await var_trips_services.record({
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
        res.status(201);
        
    }catch(error: any){
        if(error.message.includes("Missing required fields")){
            res.status(401).json({
                error: "Fill all valid fields"
            });
        }else if(error.message.includes("Trip not found")){
            res.status(404).json({
                error:"Trip not found"
            });
        }
    }
};

export const get_history = async (req:Request, res:Response)=>{
    try{
        const user_id = (req as any).user?.user_id;//jwt token 
        const {start_date, end_date, status} = req.body;
        if(!user_id){
            res.status(400).json({
                error:"UNAUTHORIZED",
                message:"user not identified"
            });
            return;
        }
        const history_results = await var_trips_services.get_history({
            user_id,
            start_date: new Date(start_date),
            end_date: end_date? new Date(end_date): undefined,
            status
        });
         res.status(200).json({
            message: "Trip history retrieved successfully",
            data: history_results
        });
    }catch(error :any){
        if (error.message.includes("Missing required fields")) {
            res.status(400).json({
                error: "Missing required fields"
            });
        } else if (error.message.includes("User not found")) {
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
export const get_trip_summary = async (req: Request, res: Response) => {
    try {
        const { trip_id } = req.params;
        const user_id = (req as any).user?.user_id;

        if (!user_id) {
            res.status(401).json({ 
                error: "UNAUTHORIZED", 
                message: "Can not view this trip" 
            });
            return;
        }

        const summary = await var_trips_services.get_summary({ trip_id, user_id });
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
export const log_event = async (req: Request, res: Response) => {
    try {
        const { trip_id } = req.params;
        const user_id = (req as any).user?.user_id;
        const { event_type, location, severity, sensor_source, timestamp } = req.body;

        if (!user_id){
            res.status(401).json({ 
                error: "UNAUTHORIZED" 
            });
            return;
        }

        const result = await var_trips_services.events_log({
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