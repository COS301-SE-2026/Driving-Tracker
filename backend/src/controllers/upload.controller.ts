import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { blob_storage_service } from "../services/blob_storage_service";
import { auth_services } from "../services/auth_services";
import { vehicle_services } from "../services/vehicle.services";
import { ExtendedError } from "../utils/errors";
import { ResponseParseType } from "@google/genai";


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
}
