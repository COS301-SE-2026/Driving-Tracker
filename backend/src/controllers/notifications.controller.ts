import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { notification_services } from "../services/notification_service";

function get_user_id(req: AuthRequest): string | null {
  return req.user?.sub ?? null;
}

const notification_controller = {

    async fetch_notifications(req: AuthRequest, res: Response){

        const user_id = get_user_id(req);

        if(!user_id){
            return res.status(401).json({error: "UNAUTHORIZED"});
        }

        try{
            const notifications = await notification_services.fetch_notifications(user_id);

            return res.status(200).json({
                message: "Notifications retrieved successfully",
                data: {
                    notifications
                }
            });

        }catch(err: any){

            return res.status(500).json({error: "INTERNAl_SERVER_ERROR", message: err?.message?? "Could not fetch notifications"});
        }

    },

    async delete_notifications(req: AuthRequest, res: Response){

        const user_id = get_user_id(req);

        if(!user_id){
            return res.status(401).json({error: "UNAUTHORIZED"});
        }

        try{
            const deleted_count = await notification_services.delete_notifications(user_id);

            return res.status(200).json({
                message: "Notifications deleted successfully",
                data: {
                    deleted_count
                }
            });

        }catch(err: any){

            return res.status(500).json({error: "INTERNAl_SERVER_ERROR", message: err?.message?? "Could not delete notifications"});
        }

    }
}

export default notification_controller;