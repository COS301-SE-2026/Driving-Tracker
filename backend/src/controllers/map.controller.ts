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
    },
    async suggested_route(req:AuthRequest, res: Response){
        try{
            const { start_lat, start_lng, dest_lat, dest_lng } = req.query;

            const route_response = await map_services.suggested_routes({
                start_lat: Number(start_lat),
                start_lng: Number(start_lng),
                dest_lat: Number(dest_lat),
                dest_lng: Number(dest_lng)
            });

            res.status(200).json({
                message: "Suggested route retrieved",
                data: route_response
            });
        }catch(error: any){
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error.message });
        }
    },
    async search_address(req: AuthRequest, res: Response){
        //should return the location no ?
        try{
            const user_id = req.user?.sub;

            if(!user_id){
                res.status(401).json({
                    error: "UNAUTHORIZED",
                    message: "Can not access map services"
                });
                return;
            };

            const { address } = req.query;
            if(typeof address !== 'string'){
                res.status(400).json({ 
                    error: "BAD_REQUEST", 
                    message: "Address query parameter is required" 
                });
                return;
            }
            const location_response = await map_services.search_address({address});

            res.status(201).json({
                message:"name translated to cooridinates",
                data:location_response
            })

        }catch(error: any){
            console.error("Error in get_map_token:", error);

            res.status(500).json({
                error: "INTERNAL_SERVER_ERROR",
                message: "Failed to translate address"
            });
        }   
    }
};

export default map_controller;