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
    },
    async get_nearby_pois(req: AuthRequest, res: Response){

        try{

            const user_id = req.user?.sub;

            if(!user_id){
                res.status(401).json({
                    error: "UNAUTHORIZED",
                    message: "Can not access map services"
                });
                return;
            };

            const {lat, lng, type, radius, limit} = req.query;

            const parsed_lat = Number(lat)
            const parsed_lng = Number(lng)
            const parsed_limit = Number(limit)
            const parsed_radius = Number(radius)

            if(!Number.isFinite(parsed_lat) || !Number.isFinite(parsed_lng)){
                throw new Error("Location coordinates missing or invalid");
            }

            const final_limit = Number.isFinite(parsed_limit)? parsed_limit : 10;
            const final_radius = Number.isFinite(parsed_radius) ? parsed_radius : 10;
            const poi_type = typeof type === "string" && type.trim() ? type : 'stops';

            const response = await map_services.get_nearby_pois(parsed_lat, parsed_lng, final_limit, poi_type, final_radius);

            res.status(200).json({
                message: "Pois succesfully retrieved", 
                data: { 
                    pois: response 
                }
            });

        } catch(error: any){

            if (error?.message?.includes("Location coordinates missing")){
                res.status(422).json({ 
                    error: "MISSING_LOCATION", 
                    message: "Location coordinates missing or invalid" 
                });
            }

            if (error?.message?.includes("Invalid type")){
                res.status(422).json({ 
                    error: "INVALID_TYPE", 
                    message: "Invalid poi type" 
                });
            }


            res.status(500).json({
                error: "INTERNAL_SERVER_ERROR",
                message: "Failed to fetch pois"
            });
        }
    },
    async get_address_reverse(req: AuthRequest, res: Response){

        try{

            const user_id = req.user?.sub;

            if(!user_id){
                res.status(401).json({
                    error: "UNAUTHORIZED",
                    message: "Can not access map services"
                });
                return;
            };

            const {lat, lng} = req.query;

            const parsed_lat = Number(lat)
            const parsed_lng = Number(lng)

            if(!Number.isFinite(parsed_lat) || !Number.isFinite(parsed_lng)){
                throw new Error("Location coordinates missing or invalid");
            }

            const response = await map_services.reverse_geocode(parsed_lat, parsed_lng);

            res.status(200).json({
                message: "Address data succesfully retrieved", 
                data: { 
                    address_data: response 
                }
            });

        } catch(error: any){

            if (error?.message?.includes("Location coordinates missing")){
                res.status(422).json({ 
                    error: "MISSING_LOCATION", 
                    message: "Location coordinates missing or invalid" 
                });
            }

            res.status(500).json({
                error: "INTERNAL_SERVER_ERROR",
                message: "Failed to fetch address"
            });
        }
    }
    
};

export default map_controller;