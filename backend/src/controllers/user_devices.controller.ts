import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { user_devices_services } from "../services/user_devices_services";
import { ExtendedError } from "../utils/errors";

const user_devices_controller = {

    async register_device_token(req: AuthRequest, res: Response) {
        const user_id = req.user?.sub?? null;

        if(!user_id){
            return res.status(401).json({error: "UNAUTHORIZED"});
        }

        const {fcm_token}=req.body;

        if(!fcm_token){

            return res.status(422).json({error: "MISSING_FCM_TOKEN", message: "Missing fcm token"});
        }

        try{

            await user_devices_services.register_device_token(user_id, fcm_token);
            return res.status(201).json({message: "Registered successfully"});

        } catch(err: any){

            if((err instanceof ExtendedError)){

                return res.status(500).json({error: err.errorCode, message: err.message});
            }

            return res.status(500).json({error: "INTERNAL_SERVER_ERROR"});
        }
        
    }
};
export default user_devices_controller;