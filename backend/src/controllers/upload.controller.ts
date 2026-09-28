import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { blob_storage_service } from "../services/blob_storage_service";
import { auth_services } from "../services/auth_services";
import { vehicle_services } from "../services/vehicle.services";
import { ExtendedError } from "../utils/errors";
import { fleet_services } from "../services/fleet_services";
import { blob } from "stream/consumers";
import { BlobLeaseClient } from "@azure/storage-blob";

const sendFileResponse = (
    res: Response,
    {
        stream, 
        content_Type, 
        content_length,
    }: { stream: any; content_Type: string; content_length?: number | null},
    cacheControl: string
) => {
    res.setHeader("Content-Type", content_Type);
    if(content_length){
        res.setHeader("Content-Length", content_length.toString());
    }
    res.setHeader("Cache-Control", cacheControl);

    stream.pipe(res);
}

export const upload_controller = {
    async upload_profile_picture(req: AuthRequest, res: Response){
        try{
            const user_id = req.user?.sub;
            if(!user_id){
                res.status(401).json({
                    error: "UNAUTHORIZED"
                });
                return;
            }

            if(!req.file){
                res.status(400).json({
                    error: "NO_FILE_PROVIDED",
                    message: "No image file was provided"
                });
                return;
            }

            const blob_name = await blob_storage_service.upload_image(req.file, "profile");
            const { display_url, previous_blob_name } = await auth_services.update_profile_picture(user_id, blob_name);

            void blob_storage_service.delete_image("profile", previous_blob_name);

            res.status(200).json({
                message: "Profile picture uploaded successfully",
                data: { profile_picture_url: display_url }
            });
        }catch(error: any){
            if(error instanceof ExtendedError && error.errorCode === "USER_NOT_FOUND"){
                res.status(404).json({ error: "USER_NOT_FOUND", message: error.message });
                return;
            }

            if(error instanceof ExtendedError && error.errorCode === "INVALID_FILE_TYPE"){
                res.status(400).json({ error: "INVALID_FILE_TYPE", message: "Only jpeg, jpg, png, and webp images are allowed" });
                return;
            }

            res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error?.message });
        }
    },

    async upload_vehicle_image(req: AuthRequest, res: Response){
        try{
            const user_id = req.user?.sub;
            if(!user_id){
                res.status(401).json({
                    error: "UNAUTHORIZED"
                });
                return;
            }

            const { vehicle_id } = req.params;
            if(!req.file){
                res.status(400).json({
                    error: "NO_FILE_PROVIDED",
                    message: "No image file was provided"
                });
                return;
            }

            const blob_name = await blob_storage_service.upload_image(req.file, "vehicle");
            const { display_url, previous_blob_name } = await vehicle_services.update_vehicle_image(user_id, vehicle_id, blob_name);

            void blob_storage_service.delete_image("vehicle", previous_blob_name);

            res.status(200).json({
                message: "Vehicle image uploaded successfully",
                data: { image_url: display_url }
            });
        }catch(error: any){
            if(error?.message === "You do not own this vehicle"){
                res.status(403).json({ error: "FORBIDDEN", message: error.message });
                return;
            }

            if(error instanceof ExtendedError && error.errorCode === "INVALID_FILE_TYPE"){
                res.status(400).json({ error: "INVALID_FILE_TYPE", message: "Only jpeg, jpg, png, and webp images are allowed" });
                return;
            }

            res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error?.message });
        }
    },

    async get_profile_picture(req:AuthRequest, res:Response){
        try{
            const requester_id = req.user?.sub;
            if(!requester_id){
                res.status(401).json({
                    error: "UNAUTHORIZED"
                });
                return;
            }

            const { user_id } = req.params;

            const blob_name = await auth_services.get_profile_picture_blob_name(user_id);
            
            if(!blob_name){
                res.status(404).json({ error: "NOT_FOUND", message: "This user has no profile picture" });
                return;
            }
            
            const { stream, content_Type, content_length } = await blob_storage_service.download("profile", blob_name);
            sendFileResponse(res, {stream, content_Type, content_length }, "private, max-age=3600");

        }catch(error: any){
            if(error instanceof ExtendedError && error.errorCode === "USER_NOT_FOUND"){
                res.status(404).json({ error: "USER_NOT_FOUND", message: error.message });
                return;
            }

            res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error?.message });
        }
    },

    async get_vehicle_image(req: AuthRequest, res: Response){
        try{
            const user_id = req.user?.sub;
            if(!user_id){
                res.status(401).json({
                    error: "UNAUTHORIZED"
                });
                return;
            }

            const { vehicle_id } = req.params;

            const blob_name = await vehicle_services.get_vehicle_image_blob_name(user_id, vehicle_id);
            if(!blob_name){
                res.status(404).json({ error: "NOT_FOUND", message: "This vehicle has no image" });
                return;
            }
            
            const { stream, content_Type, content_length } = await blob_storage_service.download("vehicle", blob_name);
            sendFileResponse(res, {stream, content_Type, content_length }, "private, max-age=3600");

        }catch(error: any){
            if(error?.message === "You do not own this vehicle"){
                res.status(403).json({ error: "FORBIDDEN", message: error.message });
                return;
            }

            res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: error?.message });
        }
    },
    
    async upload_fleet_vehicle_image(req: AuthRequest, res: Response){
        try{
            const user_id = req.user?.sub;
            const org_id = req.user?.org_id;
            
            if(!user_id || !org_id){
                return res.status(401).json({
                    error: "UNAUTHORIZED",
                });
            }

            if(!req.file){
                return res.status(400).json({
                    error: "NO_FILE_PROVIDED",
                    message: "No image file was provided",
                });
            }

            const { vehicle_id } = req.params;

            await fleet_services.get_manageable_vehicle(
                user_id, 
                org_id,
                vehicle_id,
            );

            const blob_name = await blob_storage_service.upload_image(
                req.file,
                "vehicle",
            );

            const result = await fleet_services.update_fleet_vehicle_image(
                user_id,
                org_id,
                vehicle_id,
                blob_name,
            );

            void blob_storage_service.delete_image(
                "vehicle",
                result.previous_blob_name,
            );

            return res.status(200).json({
                message: "Fleet vehicle image uploaded successfully",
                data: {
                    image_url: result.display_url,
                },
            });
        }catch(error:  any){
            if(error.message === "Fleet vehicle not found"){
                return res.status(404).json({
                    error: "VEHICLE_NOT_FOUND",
                    message: error.message,
                });
            }

            if(error instanceof ExtendedError && error.errorCode === "INVALID_FILE_TYPE"){
                return res.status(400).json({
                    error: "INVALID_FILE_TYPE",
                    message: "Only jpeg, jpg, png, and webp images are allowed",
                });
            }

            return res.status(500).json({
                error: "INTERNAL_SERVER_ERROR",
                message: error.message,
            });
        }
    },

    async get_fleet_vehicle_image(req: AuthRequest, res: Response){
        try{
            const user_id = req.user?.sub;
            const org_id = req.user?.org_id;
            
            if(!user_id || !org_id){
                return res.status(401).json({
                    error: "UNAUTHORIZED",
                });
            }

            const { vehicle_id } = req.params;

            const blob_name = await fleet_services.get_fleet_vehicle_image_blob_name(
                user_id, 
                org_id,
                vehicle_id,
            );

            if(!blob_name){
                return res.status(404).json({
                    error: "NOT_FOUND",
                    message: "This fleet vehicle has no image",
                });
            }

            const result = await blob_storage_service.download(
                "vehicle",
                blob_name,
            );

            res.setHeader("Content-Type", result.content_Type);
            if(result.content_length){
                res.setHeader(
                    "Content-Length",
                    result.content_length.toString(),
                );
            }

            res.setHeader("Cache-Control", "private, max-age=3600");
            result.stream.pipe(res);
        }catch(error:  any){
            if(error.message === "Fleet vehicle not found"){
                return res.status(404).json({
                    error: "VEHICLE_NOT_FOUND",
                    message: error.message,
                });
            }

            return res.status(500).json({
                error: "INTERNAL_SERVER_ERROR",
                message: error.message,
            });
        }
    },
}
