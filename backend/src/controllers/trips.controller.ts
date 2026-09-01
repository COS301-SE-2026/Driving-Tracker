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
            res.status(403).json({error: 'UNAUTHORIZED'});
            return ;
        }
        const { vehicle_id, start_date, data_source, start_location, share_with_contacts,end_location, fuel_level_start}= req.body;

        //sending to services
        const new_trip = await trips_services.create({
            user_id,
            vehicle_id,
            start_date,
            data_source,
            start_location,
            end_location,
            share_with_contacts,
            fuel_level_start
        });

        res.status(200).json({
            message: "trip successfully started",
            data: new_trip
        });
    }catch(error: any){
        if(error.message.includes("Missing required fields")){
            res.status(422).json({
                error: "MISSING_REQUIRED_FIELDS",
                message: "user or vehicle not known"
            });
        }
        if(error.message.includes("User not found")){
            res.status(403).json({
                error: "USER_NOT_FOUND",
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
        const { end_time, route_polyline, distance_km, duration_minutes, fuel_estimate, status,end_location,fuel_level_end } = req.body;

        if(!user_id){
            res.status(403).json({
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
            end_location,
            fuel_estimate,
            status,
            fuel_level_end
        });

        res.status(200).json({
            message:"Trip completed successfully",
            data:end_trip_results
        });
    }catch(error: any){
        if(error.message.includes("Trip not found")){
            res.status(404).json({ error: "TRIP_NOT_FOUND", message: "Trip not found" });
        } else if(error.message.includes("You do not own this trip")){
            res.status(403).json({
                error: "FORBIDDEN",
                message: "You do not own this trip"
            });
        }else if(error.message.includes("Cannot end a trip with status")){
            res.status(409).json({ error: "TRIP_ALREADY_COMPLETED"});
        } 
        else{
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
        }
    }
};

export const record_trip = async (req:AuthRequest, res:Response) =>{
    try{
        const user_id = req.user?.sub;
		const { trip_id } = req.params;
        const 	{ recorded_at,
                data_source,
                location,
                speed_kmh,
                accelerometer,
                gyroscope_x,
                gyroscope_y,
                gyroscope_z,
                rpm,
                coolant_temp_c,
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
                coolant_temp : coolant_temp_c,
                fuel_trim_percent,
                throttle_position,
                dtc_codes
        });
        res.status(201).json({
            message:"Recorded successfully"
        });
        
    }catch(error: any){
		console.error("record_trip error:", error.message);
        if(error.message === "Missing required fields"){
			/* istanbul ignore next -- unreachable via HTTP: trip_id is guaranteed by thr route, 
			user_id is checked earlier in the controller */
			res.status(400).json({
                error:"MISSING_REQUIRED_FIELDS",
                message: "Fill all valid fields"
            });
        }else if(error.message === "Trip not found"){
            res.status(404).json({
                error:"TRIP_NOT_FOUND",
				message:"Trip not found"
            });
        }else if(error.message === "You do not own this trip"){
            res.status(401).json({error:"UNAUTHORIZED"});
        }else{
			res.status(500).json({error: 'INTERNAL_SERVER_ERROR', message: error.message });
		}
    }
};
//Records readings in a batch
export const record_batch_readings = async (req: AuthRequest, res: Response) => {
    const user_id = req.user?.sub;
	const { trip_id } = req.params;

    if(!user_id){
        res.status(403).json({
            error:"UNAUTHORIZED"
        });
        return;
    }

    const { readings } = req.body

    try{
        //returns how many users are currently viewing the trip
        const active_share_count = await trips_services.record_batch_trip_readings(user_id, trip_id, readings);

        return res.status(201).json({ message: "Readings added successfully", data: { active_share_count }});

    }catch(error: any){

        if(error.message === "Missing required fields"){

			res.status(400).json({
                error: "MISSING_REQUIRED_FIELDS"
            });

        }else if(error.message === "Trip not found"){
            res.status(404).json({
                error:"TRIP_NOT_FOUND",
				message:"Trip not found"
            });
        }else if(error.message === "You do not own this trip"){
            res.status(403).json({error:"UNAUTHORIZED", message: "You do not own this trip"});
        }else{
			res.status(500).json({error: 'INTERNAL_SERVER_ERROR', message: error.message?? "Could not record readings" });
		}
    }

}

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
                error: "INTERNAL_SERVER_ERROR" 
            });
        }
    }
};

export const get_trip_latest_location = async (req: AuthRequest, res: Response) => {

    const user_id = req.user?.sub;
    const { trip_id } = req.params;

        if (!user_id) {
            res.status(401).json({ 
                error: "UNAUTHORIZED", 
                message: "Can not view this trip" 
            });
            return;
        }

        try{

            const latest_data = await trips_services.get_trip_latest_location(trip_id);

            return res.status(200).json({
                message: "Latest location successfully retrieved",
                data: {
                    last_latitude: latest_data?.last_latitude,
                    last_longitude: latest_data?.last_longitude,
                    last_recorded_at: latest_data?.last_recorded_at,
                    last_speed_kmh: latest_data?.last_speed_kmh,
                    status: latest_data?.status
                }
            });

        }catch(error: any){

            if (error.message.includes("Trip not found")){
                res.status(404).json({ 
                    error: "TRIP_NOT_FOUND", 
                    message: "Trip not found" 
                });
            }

            res.status(500).json({ 
                error: "INTERNAL_SERVER_ERROR" 
            });
        }    
};

export const get_trips_shared_with_me = async (req: AuthRequest, res: Response) => {

    const user_id = req.user?.sub;

    if(!user_id) {
            res.status(401).json({ 
                error: "UNAUTHORIZED", 
                message: "Can not view this trip" 
            });
            return;
        }

    try{

        const result = await trips_services.get_trips_shared_with_me(user_id);

        return res.status(200).json({ 
            message: "Successfully fetched trips shared with you",
            data: {
                trips: result
            }
        });

    } catch(error: any){

        res.status(500).json({ 
            error: "INTERNAL_SERVER_ERROR" 
        });
    }
}

export const check_stop_event = async (req: AuthRequest, res: Response) => {

    const user_id = req.user?.sub;

    if(!user_id) {
            res.status(401).json({ 
                error: "UNAUTHORIZED", 
                message: "Unauthorized to log unexpected stop event" 
            });
            return;
        }

    const { trip_id } = req.params;

    const { location, stopped_at} = req.body;

    try{

        const result = await trips_services.check_stop(user_id, trip_id, location.lat, location.lng, stopped_at);

        return res.status(200).json({ 
            message: "Stop event check completed successfully",
            data: result
        });

    } catch(error: any){

        if (error.message.includes("Location coordinates missing")){
                res.status(400).json({ 
                    error: "INVALID_LOCATION", 
                    message: "Location coordinates missing or invalid" 
                });
        }

        if (error.message.includes("stopped_at cannot be in the future")){
                res.status(422).json({ 
                    error: "INVALID_STOP", 
                    message: "Stopped_at cannot be in the future" 
                });
        }

        res.status(500).json({ 
            error: "INTERNAL_SERVER_ERROR",
            message: "Could not successfully check stop"
        });
    }
}

export const confirm_stop_event = async (req: AuthRequest, res: Response) => {

    const user_id = req.user?.sub;

    if(!user_id) {
            res.status(401).json({ 
                error: "UNAUTHORIZED", 
                message: "Unauthorized to confirm unexpected stop event" 
            });
            return;
        }

    const { event_id } = req.params;

    try{

        const result = await trips_services.confirm_stop(user_id, event_id);

        return res.status(200).json({ 
            message: "Unexpected stop confirmed",
            data: result
        });

    } catch(error: any){

        if (error.message.includes("user not found")){
            return res.status(403).json({ 
                error: "USER_NOT_FOUND", 
                message: "User not found" 
            });
        }

        if (error.message.includes("event not found")){
            return res.status(400).json({ 
                error: "EVENT_NOT_FOUND", 
                message: "Unexpected stop event not found" 
            });
        }

        return res.status(500).json({ 
            error: "INTERNAL_SERVER_ERROR",
            message: "Could not successfully confirm stop"
        });
    }
}

export const resolve_stop_event = async (req: AuthRequest, res: Response) => {

    const user_id = req.user?.sub;

    if(!user_id) {
            res.status(401).json({ 
                error: "UNAUTHORIZED", 
                message: "Unauthorized to resolve unexpected stop event" 
            });
            return;
        }

    const { event_id } = req.params;

    const { reason } = req.body;

    try{

        const result = await trips_services.resolve_stop(user_id, event_id, reason);

        return res.status(200).json({ 
            message: "Unexpected stop resolved",
            data: result
        });

    } catch(error: any){

        if (error.message.includes("user not found")){
            return res.status(403).json({ 
                error: "USER_NOT_FOUND", 
                message: "User not found" 
            });
        }

        if (error.message.includes("event not found")){
            return res.status(400).json({ 
                error: "EVENT_NOT_FOUND", 
                message: "Unexpected stop event not found" 
            });
        }

        if (error.message.includes('reason missing')){
            return res.status(422).json({ 
                error: "REASON_MISSING", 
                message: "Reason parameter needed" 
            });
        }

        if (error.message.includes('cannot access event')){
            return res.status(403).json({ 
                error: "UNAUTHORIZED", 
                message: "Cannot access this event" 
            });
        }

        return res.status(500).json({ 
            error: "INTERNAL_SERVER_ERROR",
            message: "Could not successfully resolve stop"
        });
    }
}