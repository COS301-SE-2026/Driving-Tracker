import {Request, Response} from 'express';
import {auth_services} from  "../services/auth_services";
import {generate_token, AuthRequest} from "../middleware/auth";//the file containing the tokens 
import { ConflictError, ExtendedError, ValidationError } from '../utils/errors';

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
            //User and refresh token returned from service
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
    },
    //refreshes expired access_token if refresh_token is still valid. Also rotates refresh_token
    async refresh(req: Request, res: Response){

        const {refresh_token}= req.body;

        if(!refresh_token){

            res.status(400).json({error: "MISSING_REFRESH_TOKEN", message:"Refresh token required"});
            return;
        }

        try{

            const {user, new_refresh_token}= await auth_services.refresh(refresh_token);

            const access_token=generate_token({user: user.user_id, role: user.role});

            res.status(200).json({
                token: access_token,
                refresh_token: new_refresh_token
            });
        }catch(err){

            if(err instanceof ExtendedError){

                res.status(401).json({
                    error: err.errorCode, 
                    message: err.message
                });
                return;
            }

            res.status(500).json({error: "INTERNAL_SERVER_ERROR"});
        }
    }

};

export default auth_controller;