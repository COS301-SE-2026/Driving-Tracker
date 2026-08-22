import {Request, Response} from 'express';
import {auth_services} from  "../services/auth_services";
import {generate_token, AuthRequest} from "../middleware/auth";//the file containing the tokens 
import { ConflictError, ExtendedError, ValidationError } from '../utils/errors';
import { identifier_limiter } from '../middleware/rate_limit';

const isTestEnv = process.env.NODE_ENV === 'test';

const auth_controller={
    //Register controller method
    async register(req:Request, res: Response){

        const {email, username, password, name, surname, phone_number, dob, consent_status}=req.body;

        try{
            await auth_services.register(email,username,name,surname,password,phone_number,dob,consent_status);

            return res.status(201).json({
                message: "Registration successful. Please verify your email before logging in."
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

        
        const fail_res = await identifier_limiter.get(identifier);

        if(fail_res && fail_res.remainingPoints <= 0){

            return res.status(429).json({ error: "TOO_MANY_ATTEMPTS", message: "Too many login attempts, try again later"})
        }
            
        

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

               
                await identifier_limiter.consume(identifier).catch(() => {});
                
                res.status(401).json({error:err.errorCode, message: err.message});
                return; 
            }

			if(err instanceof ExtendedError){
				return res.status(403).json({ error: err.errorCode, message: err.message });
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

            const access_token=generate_token({sub: user.user_id, role: user.role});

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
    },

    async get_profile(req: AuthRequest, res: Response){
        try{ 
            const user_id = req.user?.sub;
            if(!user_id){
                return res.status(401).json({
                    error: "UNAUTHORIZED"
                });
            }
            const profile = await auth_services.get_profile(user_id);
            return res.status(200).json({
                data: profile,
                message: "Profile retrieved successfully"
            });
        }catch(err: any){
            return res.status(500).json({
                error: "INTERNAL_SERVER_ERROR",
                message: "Failed to retrieve profile"
            });
        }
    },

    async verify_email(req: Request, res: Response){
        const token  = typeof req.query.token === "string" ? req.query.token : "";
        if(!token){
            return res.status(400).json({
                error: "INVALID_TOKEN",
                message: "Verification token is required"
            });
        }
        try{
            await auth_services.verify_email(token);
			//302 status code
			return res.redirect("driving-tracker://verify-success");
            //res.status(200).json({ message: "Email verified successfully"});
        }catch(err: any){
            if(err instanceof ValidationError){
                return res.status(422).json({ error: err.errorCode, message: err.message})
            }
            res.status(400).json({ error: "INVALID_TOKEN", message: err.message});
        }
    },

    async forgot_password(req: Request, res: Response){
        const { email } = req.body;
        try{
            await auth_services.request_password_reset(email);
            res.status(200).json({ message: "Reset email sent if account exists"});
        }catch(err){
            res.status(500).json({ error: "INTERNAL_SERVER_ERROR"});
        }
    },

    async reset_password_link(req: Request, res: Response){
        const token = typeof req.query.token === "string" ? req.query.token : "";
        if(!token){
            return res.status(400).json({
                error: "INVALID_TOKEN",
                message: "Reset token is required"
            });
        }

        return res.redirect(
            `driving-tracker://reset-password?token=${encodeURIComponent(token)}`
        );

    },

    async reset_password(req: Request, res: Response){
        const { token, password } = req.body;
        try{
            await auth_services.reset_password(token, password);
            res.status(200).json({ message: "Password reset successfully"});
        }catch(err: any){
            if(err instanceof ValidationError){
                return res.status(422).json({ error: err.errorCode, message: err.message})
            }
            res.status(400).json({ error: "INVALID_TOKEN", message: err.message});
        }
    }

};

export default auth_controller;