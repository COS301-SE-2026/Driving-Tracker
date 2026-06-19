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