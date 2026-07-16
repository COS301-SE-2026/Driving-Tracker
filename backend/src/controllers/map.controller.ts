import type  { Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { map_services } from "../services/map_services";

const map_controller = {
    async get_map_token(req: AuthRequest, res: Response){
        try{
            const user_id = req.user?.sub;

            if(!user_id){
                res.status(401).json({
                    error: "UNAUTHORIZED",
                    message: "Can not access map services"
                });
                return;
            }

            const token_response = await map_services.get_map_token();

            res.status(200).json({
                message: "Map token retrieved successfully",
                data: token_response
            });
        }catch(error: any){
            console.error("Error in get_map_token:", error);

            res.status(500).json({
                error: "INTERNAL_SERVER_ERROR",
                message: "Failed to retrieve map token"
            });
        }
    }
};

export default map_controller;