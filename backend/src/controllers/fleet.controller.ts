import { AuthRequest } from "../middleware/auth";
import { Response } from 'express';
import { fleet_services } from "../services/fleet_services";
import { OrganizationRole } from '@prisma/client';


const fleet_controller = {
    async add_organization(req: AuthRequest, res: Response){

        const user_id = req.user?.sub;

        if(!user_id){
            return res.status(401).json({
                error: "UNAUTHORIZED"
            });
        }

        try{

            const { name } = req.body;
            
            const result = await fleet_services.add_organization(user_id, name);

            return res.status(201).json({
                message: 'Organization successfully added',
                data: result,
            });

        }catch(error: any){

            if(error.message.includes("Failed to create organization")){

                return res.status(500).json({
                    error: "INTERNAL_SERVER_ERROR", message: "Failed to add organization"
                });
            }

            if(error.message.includes("Name cannot be empty")){

                return res.status(422).json({
                    error: "INVALID_NAME", message: "Name cannot be empty"
                });
            }

            if(error.message.includes("Failed to add user to organization")){

                return res.status(500).json({
                    error: "INTERNAL_SERVER_ERROR", message: "Failed to add user to organization"
                });
            }
  
            return res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });

        }

    },

    async list_fleet_drivers(req: AuthRequest, res: Response){
        const user_id = req.user?.sub;
        const org_id = req.user?.org_id;
        const org_role = req.user?.org_role;

        if(!user_id){
            return res.status(401).json({
                error: "UNAUTHORIZED"
            });
        }

        if((org_role && !org_id) || (org_id && !org_role)){
            res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong processing your session' });
            return;
        }
        
        if((!org_role && !org_id) 
            || (org_role !== OrganizationRole.ADMIN && org_role !== OrganizationRole.MANAGER) || !org_id){
            res.status(403).json({ error: 'UNAUTHORIZED', message: 'You do not have the permissions to add a fleet vehicle' });
            return;
        }

        try{
            
            const drivers = await fleet_services.list_fleet_drivers(user_id, org_id);

            return res.status(200).json({
                message: 'Fleet drivers successfully retrieved',
                data: { drivers },
            });

        }catch(error: any){

            if(error?.message?.includes("You do not have permission to list fleet drivers")){

                return res.status(403).json({
                    error: "UNAUTHORIZED", message: error.message
                });
            }
  
            return res.status(500).json({ error: "INTERNAL_SERVER_ERROR", message: "Failed to retrieve fleet drivers" });

        }


    }
};

export default fleet_controller;