import type { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { user_services } from "../services/user_services";
import { ExtendedError, ValidationError} from "../utils/errors";

const user_controller = {
    async delete_account(req: AuthRequest, res:Response){

        const user_id = req.user?.sub ?? null;

        if (!user_id){
            return res.status(401).json({error: "UNAUTHORIZED"});
        }

        const { password} = req.body;

        if(!password){
            return res.status(422).json({error: "MISSING_PASSWORD", message: "Password is required."});
        }

        try{
            await user_services.delete_account(user_id, password);
            return res.status(204).send();
        }

        catch (err: any){

            if (err instanceof ValidationError){
                return res.status(422).json({error: err.errorCode, message: err.message});
            }
            if (err instanceof ExtendedError){
                const status = err.errorCode === "UNAUTHORIZED" ? 401 : 500;
                return res.status(status).json({error: err.errorCode, message: err.message});
            }
            return res.status(500).json({error: "INTERNAL_SERVER_ERROR"});
        }
    }
};

export default user_controller;