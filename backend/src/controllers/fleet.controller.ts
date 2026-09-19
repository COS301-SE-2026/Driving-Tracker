import { AuthRequest } from "../middleware/auth";
import { Response } from 'express';
import { fleet_services } from "../services/fleet_services";


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
};

export default fleet_controller;