import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { vehicle_services } from '../services/vehicle.services';


export const get_all_vehicles = async(req: AuthRequest, res: Response)=>{
    try{
        const user_id = req.user?.sub;
        if(!user_id){
            res.status(403).json({error: "UNAUTHORIZED", message: 'Unauthorized'});
            return ;
        };
        const vehicles = await vehicle_services.get_all_vehicles({user_id});
        res.status(200).json(vehicles);
    }catch(error : any){
        if(error.message.includes("Missing required fields")){
            res.status(403).json({
                error: "INVALID_FIELDS",
                message: "user or vehicle not known"
            });
        }
        if(error.message.includes("User not found")){
            res.status(403).json({
                error: "UNAUTHORIZED",
                message: "Unauthorized"
            });
        }
    }
};

export const assign_vehicle = async(req: AuthRequest,res: Response)=>{
    try{
        const user_id = req.user?.sub;
        if(!user_id){
            res.status(403).json({ error: 'UNAUTHORIZED', message: 'Unauthorized' });
            return;
        }
        const { name, registration, make, model, year, fuel_type, fuel_tank } = req.body;

        //Validate required fields
        if( !make || !model || !year || !fuel_type || !fuel_tank){
            res.status(400).json({
                error: "MISSING_REQUIRED_FIELDS", message: "Missing required fields: make, model, year, fuel_type, fuel_tank",
            });
            return;
        }
        const result = await vehicle_services.assign_user_to_vehicle({
            user_id,
			name,
            registration,
			make,
            model,
            year,
            fuel_type,
            fuel_tank
        });
        res.status(201).json(result);
    }catch(error: any){
        if(error.message.includes("User does not exist")){
            res.status(404).json({
                error: "USER_NOT_FOUND",
                message: "User not found"
            });
            return;
        }
        if(error.message.includes("Missing field(s)")){
            res.status(400).json({
                error: "MISSING_REQUIRED_FIELDS",
                message: "Missing required fields"
            });
            return;
        }
        res.status(500).json({
            error: "INTERNAL_SERVER",
            message: error.message ? error.message: "Internal server error"
        });
    }
};

export const update_name = async (req: AuthRequest, res: Response) => {
    try{
        const user_id = req.user?.sub;
        const { vehicle_id } = req.params;
        const{ name } = req.body;

        if(!user_id) return res.status(401).json({ error: "UNAUTHORIZED", message: 'Unauthorized'});

        const result = await vehicle_services.update_vehicle_name({
            user_id,
            vehicle_id, 
            name
        });
        res.status(200).json(result);
    }catch(error: any){
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message ? error.message: "Internal server error" });
    }
};

export const remove_vehicle = async (req: AuthRequest, res: Response) => {
    try{
        const user_id = req.user?.sub;
        const { vehicle_id } = req.params;

        if(!user_id) return res.status(401).json({ error: "UNAUTHORIZED", message: 'Unauthorized'});

        const result = await vehicle_services.remove_vehicle(
            user_id,
            vehicle_id,
        );
        res.status(200).json(result);
    }catch(error: any){
        if(error.message.includes("Vehicle not found or not owned")){
            return res.status(404).json({ error: "INVALID_VEHICLE", message: error.message });
        }
        res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Internal server error" });
    }
};

export const get_fuel_analytics = async (req: AuthRequest, res: Response) => {

    try{
        const user_id = req.user?.sub;

        if (!user_id){
            res.status(403).json({message: 'Unauthorized'});
            return;
        }

        const result = await vehicle_services.get_fuel_analytics({user_id});
        res.status(200).json(result);
    }
    
    catch(error: any){
        res.status(500).json(
            {
                message: "Internal server error",
                error: error.message
            }
        );
    }
}

export const get_fuel_comparison = async (req: AuthRequest, res: Response) => {
    try {
        const user_id = req.user?.sub;
        if (!user_id) {
            return res.status(401).json({ error: "UNAUTHORIZED" });
        }

        const result = await vehicle_services.get_fuel_comparison({ user_id });
        res.status(200).json({ data: result });
    } catch (error: any) {
        res.status(500).json({
            error: "INTERNAL_SERVER_ERROR",
            message: error.message || "Could not retrieve fuel comparison"
        });
    }
};