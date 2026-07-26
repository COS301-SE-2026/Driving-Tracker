import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth';
import { vehicle_services } from '../services/vehicle.services';


export const get_all_vehicles = async(req: AuthRequest, res: Response)=>{
    try{
        const user_id = req.user?.sub;
        if(!user_id){
            res.status(403).json({message: 'Unauthorized'});
            return ;
        };
        const vehicles = await vehicle_services.get_all_vehicles({user_id});
        res.status(200).json(vehicles);
    }catch(error : any){
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
    }
};
export const assign_vehicle = async(req: AuthRequest,res: Response)=>{
    try{
        const user_id = req.user?.sub;
        if(!user_id){
            res.status(403).json({ message: 'Unauthorized' });
            return;
        }
        const { name, registration, make, model, year, fuel_type } = req.body;

        //Validate required fields
        if( !make || !model || !year || !fuel_type){
            res.status(400).json({
                message: "Missing required fields: make, model, year, fuel_type"
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
            fuel_type
        });
        res.status(201).json(result);
    }catch(error: any){
        if(error.message.includes("User does not exist")){
            res.status(404).json({
                message: "User not found"
            });
            return;
        }
        if(error.message.includes("Missing field(s)")){
            res.status(400).json({
                message: "Missing required fields"
            });
            return;
        }
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
};