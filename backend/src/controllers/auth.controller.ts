import {Request, Response} from 'express';
import {auth_services} from  "../services/auth_services";
import {generate_token, AuthRequest} from "../middleware/auth";//the file containing the tokens 
import { ConflictError, ValidationError } from '../utils/errors';

const auth_controller={
    //Register controller method
    async register(req:Request, res: Response){

        const {email, username, password, name, surname, consent_status}=req.body;

        try{
            //User and refresh token returned from service
            const {user, refresh_token}=await auth_services.register(email,username,name,surname,password,consent_status);

            //Generating access token
            const access_token=generate_token({sub: user.user_id, role: user.role});

            //response body includes access token and refresh token for auto-login after signup
            return res.status(201).json({
                token:access_token, 
                refresh_token
            });

        }catch(err:any){

            if(err instanceof ValidationError){
                res.status(422).json({error: err.errorCode, message: err.message});
                return;
            }

            if(err instanceof ConflictError){
                res.status(409).json({error: err.errorCode, message: err.message});
                return;
            }

            res.status(500).json({error:"INTERNAL_SERVER_ERROR"});
            return;
            
        }
    },
    async login(req:Request, res: Response){

        const {identifier, password}=req.body;

        try{
            //User and reefreesh token returned from service
            const {user, refresh_token}=await auth_services.login(identifier,password);

            //Generating access token
            const access_token=generate_token({sub: user.user_id, role: user.role});

            return res.status(201).json({
                token:access_token, 
                refresh_token
            });

        }catch(err:any){

            if((err instanceof ValidationError)){

                res.status(401).json({error:err.errorCode, message: err.message});
                return; 
            }

            res.status(500).json({error:"INTERNAL_SERVER_ERROR"});
            return;
            
        }

    },
    async logout(req: AuthRequest, res: Response){

        try{
            //Nothing returned from service
           await auth_services.logout(req.user!.sub!);
           return res.status(200).json({message:"Logged out successfully"});
        }catch(err:any){

            return res.status(500).json({error:"INTERNAL_SERVER_ERROR", message:"Failed to log out"});
            
        }
    }

};

export default auth_controller;